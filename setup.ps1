
$centralDbName = "central_db"
$shardCount = 5 
$storesPerShard = 4
$totalStores = $shardCount * $storesPerShard
$rootPassword = "securepassword"
$networkName = "store-network"

docker network create $networkName

docker run -d --name central-db --network $networkName `
  -e MYSQL_ROOT_PASSWORD=$rootPassword `
  -e MYSQL_DATABASE=$centralDbName `
  mysql:8.0

# Wait for central DB to initialize
Start-Sleep -Seconds 30

# Create shard databases
foreach ($shard in 1..$shardCount) {
    $shardName = "shard-$shard"
    
    docker run -d --name $shardName --network $networkName `
        -e MYSQL_ROOT_PASSWORD=$rootPassword `
        mysql:8.0
    
    Start-Sleep -Seconds 20
    
    $startStore = ($shard - 1) * $storesPerShard + 1
    $endStore = $shard * $storesPerShard
    
    foreach ($store in $startStore..$endStore) {
        $dbName = "store_$store"
        Write-Host "Creating database $dbName on shard $shardName..."
        docker exec $shardName bash -c "export MYSQL_PWD='$rootPassword'; mysql -uroot -e 'CREATE DATABASE $dbName;'"
    }
}   

Write-Host "Shard databases created successfully."
Start-Sleep -Seconds 30
Write-Host "`nCreating Central Database Schema..."


$centralSetup = @"
CREATE TABLE stores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    region VARCHAR(50) NOT NULL
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id INT NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    role ENUM('cashier', 'manager', 'admin') NOT NULL
);
"@


write-host "Applying schema to central database..."
docker exec central-db bash -c "export MYSQL_PWD='$rootPassword'; mysql -uroot $centralDbName -e \"$centralSetup\""

Write-Host "Central database schema created successfully."
Write-Host "`nCreating Shard Databases Schema..."

# Create tables in store databases
$storeSchema = @"
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    category VARCHAR(50) NOT NULL
);

CREATE TABLE sales (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INT NOT NULL,
    INDEX (timestamp)
);

CREATE TABLE inventory_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    change INT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
"@

Write-Host "Applying schema to store databases..."

foreach ($shard in 1..$shardCount) {
    $shardName = "shard-$shard"
    $startStore = ($shard - 1) * $storesPerShard + 1
    $endStore = $shard * $storesPerShard
    
    foreach ($store in $startStore..$endStore) {
        $dbName = "store_$store"
        docker exec $shardName bash -c "export MYSQL_PWD='$rootPassword'; mysql -uroot $dbName -e \"$storeSchema\""
    }
}


# Generate shard map configuration file
$shardMap = @{}

foreach ($shard in 1..$shardCount) {
    $shardName = "shard-$shard"
    $ip = docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $shardName

    $startStore = ($shard - 1) * $storesPerShard + 1
    $endStore = $shard * $storesPerShard

    foreach ($store in $startStore..$endStore) {
        $key = [string]$store
        $shardMap[$key] = @{
            host = $ip
            database = "store_$store"
        }
    }
}

# Now convert to JSON and output
$shardMap | ConvertTo-Json | Out-File -FilePath "shard-map.json"

Write-Host "`nDistributed Database Setup Complete!"
Write-Host "==================================="
Write-Host "Central DB:"
Write-Host "  Container: central-db"
Write-Host "  Database: $centralDbName"
Write-Host "  Root Password: $rootPassword"

Write-Host "`nShard Servers:"
foreach ($shard in 1..$shardCount) {
    $shardName = "shard-$shard"
    $ip = docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $shardName
    Write-Host "  $shardName (IP: $ip) hosts stores: " -NoNewline
    
    $start = ($shard - 1) * $storesPerShard + 1
    $end = $shard * $storesPerShard
    Write-Host "$start to $end"
}

Write-Host "`nShard map saved to: shard-map.json"
Write-Host "Total stores configured: $totalStores"
Write-Host "Network: $networkName"