# Fixed Docker Sharded MySQL Setup Script
# Requires: Docker Desktop installed and running

# Configuration
$centralDbName = "central_db"
$shardCount = 5
$storesPerShard = 4
$totalStores = $shardCount * $storesPerShard
$rootPassword = "securepassword"
$networkName = "store-network"

# Port configuration
$centralPort = 3406
$shardStartPort = 3407

# Paths
$centralSchemaPath = "schemas/centralSchema.sql"
$storeSchemaPath = "schemas/storeSchema.sql"

# Create Docker network
docker network create $networkName
Write-Host "Created network: $networkName"

# Start Central Metadata Database
docker run -d --name central_db --network $networkName `
  -p ${centralPort}:3306 `
  -e MYSQL_ROOT_PASSWORD=$rootPassword `
  -e MYSQL_DATABASE=$centralDbName `
  mysql:8.0

Write-Host "Started central database on port $centralPort"
Write-Host "Waiting for central DB to initialize..."
Start-Sleep -Seconds 30

# Copy and apply central schema
docker cp $centralSchemaPath ${centralDbName}:/centralSchema.sql
docker exec central_db bash -c "export MYSQL_PWD='$rootPassword'; mysql -uroot $centralDbName < /centralSchema.sql"
Write-Host "Created central database schema from file"

# Create shard databases
$shardPort = $shardStartPort
foreach ($shard in 1..$shardCount) {
    $shardName = "shard-$shard"

    docker run -d --name $shardName --network $networkName `
        -p "${shardPort}:3306" `
        -e MYSQL_ROOT_PASSWORD=$rootPassword `
        mysql:8.0

    Write-Host "Started shard $shardName on port $shardPort"
    Write-Host "Waiting for shard to initialize..."
    Start-Sleep -Seconds 20

    Write-Host "Copying store schema to $shardName"
    docker cp $storeSchemaPath ${shardName}:/storeSchema.sql

    $startStore = ($shard - 1) * $storesPerShard + 1
    $endStore = $shard * $storesPerShard

    foreach ($store in $startStore..$endStore) {
        $dbName = "store_$store"
        docker exec $shardName bash -c "export MYSQL_PWD='$rootPassword'; mysql -uroot -e 'CREATE DATABASE IF NOT EXISTS $dbName;'"
        docker exec $shardName bash -c "export MYSQL_PWD='$rootPassword'; mysql -uroot $dbName < /storeSchema.sql"
        Write-Host "Created store database schema for $dbName on $shardName from file"
    }

    $shardPort++
}

# Generate shard maps
$hostShardMap = @{}
$containerShardMap = @{}
$currentPort = $shardStartPort

foreach ($shard in 1..$shardCount) {
    $shardName = "shard-$shard"
    $ip = docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $shardName

    $startStore = ($shard - 1) * $storesPerShard + 1
    $endStore = $shard * $storesPerShard

    foreach ($store in $startStore..$endStore) {
        $key = "$store"

        $hostShardMap[$key] = @{
            host = "localhost"
            port = $currentPort
            database = "store_$store"
        }

        $containerShardMap[$key] = @{
            host = $shardName
            port = 3406
            database = "store_$store"
        }
    }

    $currentPort++
}

# Save config maps
New-Item -ItemType Directory -Force -Path "config" | Out-Null
$hostShardMap | ConvertTo-Json -Depth 3 | Out-File -FilePath "config/shardMap.json"
$containerShardMap | ConvertTo-Json -Depth 3 | Out-File -FilePath "config/shardMapContainer.json"

# Display setup info
Write-Host "`nDistributed Database Setup Complete!"
Write-Host "==================================="
Write-Host "Central DB:"
Write-Host "  Container: central-db"
Write-Host "  Host Access: localhost:$centralPort"
Write-Host "  Database: $centralDbName"
Write-Host "  Root Password: $rootPassword"

Write-Host "`nShard Servers (Host Access):"
$currentPort = $shardStartPort
foreach ($shard in 1..$shardCount) {
    $shardName = "shard-$shard"
    $start = ($shard - 1) * $storesPerShard + 1
    $end = $shard * $storesPerShard
    Write-Host "  $shardName (Port: $currentPort) hosts stores: $start to $end"
    $currentPort++
}

Write-Host "`nShard Servers (Container DNS Access):"
foreach ($shard in 1..$shardCount) {
    $shardName = "shard-$shard"
    $ip = docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $shardName
    $start = ($shard - 1) * $storesPerShard + 1
    $end = $shard * $storesPerShard
    Write-Host "  $shardName (IP: $ip) hosts stores: $start to $end"
}

Write-Host "`nShard maps saved to:"
Write-Host "  - config/shardMap.json (for host machine access)"
Write-Host "  - config/shardMapContainer.json (for Docker container access)"
Write-Host "Total stores configured: $totalStores"
Write-Host "Network: $networkName"
