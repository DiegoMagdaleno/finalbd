#!/bin/bash

# Test Data Generation Script
# Run after initial setup when containers are running

rootPassword="securepassword"
productsPerStore=100
salesPerStore=500

# Regions for store distribution
regions=("North" "South" "East" "West" "Central")

# Product categories and names
declare -A productNames
productNames["Food & Beverage"]="Chips Soda Chocolate\ Bar Energy\ Drink Bottled\ Water Candy Coffee Juice"
productNames["Electronics"]="Headphones Phone\ Charger Power\ Bank USB\ Cable Earbuds Screen\ Protector Mouse"
productNames["Clothing"]="T-Shirt Socks Hat Gloves Scarf Belt"
productNames["Home Goods"]="Light\ Bulb Batteries Kitchen\ Knife Plates Cups Towel"
productNames["Health & Beauty"]="Shampoo Toothpaste Deodorant Soap Lotion Sunscreen"
productNames["Automotive"]="Motor\ Oil Air\ Freshener Car\ Wax Ice\ Scraper Tire\ Gauge"
productNames["Office Supplies"]="Pen Notebook Stapler Tape Highlighters Sticky\ Notes"
productNames["Toys & Games"]="Playing\ Cards Puzzle Action\ Figure Board\ Game Coloring\ Book"

categories=("${!productNames[@]}")

# 1. Insert stores into central database
echo "Inserting stores into central database..."
storeInsert="INSERT INTO stores (name, address, region) VALUES"
for i in $(seq 1 20); do
    region=${regions[$((i % ${#regions[@]}))]}
    storeInsert+=" ('Store $i', '123 Main St, Location $i', '$region')"
    [[ $i -lt 20 ]] && storeInsert+=","
done

docker exec central-db mysql -uroot -p"$rootPassword" central_db -e "$storeInsert"
echo "Inserted 20 stores"

# 2. Insert products into each store
echo "Generating products for all stores..."
for shard in $(seq 1 5); do
    shardName="shard-$shard"
    startStore=$(( (shard - 1) * 4 + 1 ))
    endStore=$(( shard * 4 ))

    for store in $(seq $startStore $endStore); do
        dbName="store_$store"
        productInsert="INSERT INTO products (name, price, stock, category) VALUES"

        for ((p=1; p<=productsPerStore; p++)); do
            category=${categories[$((RANDOM % ${#categories[@]}))]}
            names=(${productNames["$category"]})
            baseProduct=${names[$((RANDOM % ${#names[@]}))]}
            productName="$baseProduct $((RANDOM % 1000 + 1))"
            price=$(awk "BEGIN { printf \"%.2f\", ($RANDOM % 4950 + 50) / 100 }")
            stock=$((RANDOM % 191 + 10))

            productInsert+=" ('$productName', $price, $stock, '$category')"
            [[ $p -lt $productsPerStore ]] && productInsert+=","
        done

        docker exec "$shardName" mysql -uroot -p"$rootPassword" "$dbName" -e "$productInsert"
        echo "Inserted $productsPerStore products in $dbName"
    done
done

# 3. Generate sales data
echo "Generating sales records..."
for shard in $(seq 1 5); do
    shardName="shard-$shard"
    startStore=$(( (shard - 1) * 4 + 1 ))
    endStore=$(( shard * 4 ))

    for store in $(seq $startStore $endStore); do
        dbName="store_$store"
        productIds=$(docker exec "$shardName" mysql -uroot -p"$rootPassword" "$dbName" -N -e "SELECT id FROM products;" | grep -E '^[0-9]+$')

        salesInsert="INSERT INTO sales (product_id, quantity, amount, user_id, timestamp) VALUES"
        inventoryInsert="INSERT INTO inventory_logs (product_id, change) VALUES"

        productArray=($productIds)
        totalProducts=${#productArray[@]}

        for ((s=1; s<=salesPerStore; s++)); do
            productId=${productArray[$((RANDOM % totalProducts))]}
            quantity=$((RANDOM % 5 + 1))
            price=$(docker exec "$shardName" mysql -uroot -p"$rootPassword" "$dbName" -N -e "SELECT price FROM products WHERE id = $productId;" | awk '{print $1}')
            amount=$(awk "BEGIN { printf \"%.2f\", $price * $quantity }")

            daysAgo=$((RANDOM % 90 + 1))
            hoursAgo=$((RANDOM % 24))
            minutesAgo=$((RANDOM % 60))
            timestamp=$(date -d "$daysAgo days ago $hoursAgo hours ago $minutesAgo minutes ago" +"%Y-%m-%d %H:%M:%S")

            userId=$((RANDOM % 5 + 1))

            salesInsert+=" ($productId, $quantity, $amount, $userId, '$timestamp')"
            inventoryInsert+=" ($productId, -$quantity)"
            [[ $s -lt $salesPerStore ]] && {
                salesInsert+=","
                inventoryInsert+=","
            }
        done

        docker exec "$shardName" mysql -uroot -p"$rootPassword" "$dbName" -e "$salesInsert"
        docker exec "$shardName" mysql -uroot -p"$rootPassword" "$dbName" -e "$inventoryInsert"

        docker exec "$shardName" mysql -uroot -p"$rootPassword" "$dbName" -e "
            UPDATE products p
            JOIN (
                SELECT product_id, SUM(change) AS total_change
                FROM inventory_logs
                GROUP BY product_id
            ) il ON p.id = il.product_id
            SET p.stock = p.stock + il.total_change"

        echo "Inserted $salesPerStore sales in $dbName"
    done
done

# Summary
echo ""
echo "Test data generation complete!"
echo "==================================="
echo "Summary:"
echo "- 20 stores inserted in central database"
echo "- $productsPerStore products per store (total $((productsPerStore * 20)))"
echo "- $salesPerStore sales per store (total $((salesPerStore * 20)))"
