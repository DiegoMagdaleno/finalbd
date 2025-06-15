//PARA LLENAR CENTRAL_DB STORES y USERS:

const mysql = require('mysql2');
const { faker } = require('@faker-js/faker');

// Configuración de conexión
const connection = mysql.createConnection({
    host: '127.0.0.1',
    port: 3406, // Puerto de central-db
    user: 'root',
    password: 'securepassword',
    database: 'central_db'
});

// Conectar
connection.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conexión exitosa a central_db');

    // Insertar tiendas
    const insertStore = (name, address, region, callback) => {
        const sql = 'INSERT INTO stores (name, address, region) VALUES (?, ?, ?)';
        connection.query(sql, [name, address, region], callback);
    };

    // Insertar usuarios
    const insertUser = (storeId, username, passwordHash, role, callback) => {
        const sql = 'INSERT INTO users (store_id, username, password_hash, role) VALUES (?, ?, ?, ?)';
        connection.query(sql, [storeId, username, passwordHash, role], callback);
    };

    // Insertar tiendas y usuarios
    const roles = ['cashier', 'manager', 'admin'];
    let storeInsertions = 0;

    for (let i = 0; i < 20; i++) {
        const name = `Tienda ${i + 1}`;
        const address = faker.location.streetAddress();
        const region = faker.location.state();

        insertStore(name, address, region, (err, result) => {
            if (err) {
                console.error(`Error al insertar tienda ${i + 1}:`, err);
                return;
            }
            const storeId = result.insertId;

            // Insertar 5 usuarios por tienda
            for (let j = 0; j < 5; j++) {
                const username = faker.internet.userName({ firstName: faker.person.firstName() });
                const passwordHash = faker.internet.password({ length: 12 });
                const role = roles[Math.floor(Math.random() * roles.length)];

                insertUser(storeId, username, passwordHash, role, (err, result) => {
                    if (err) {
                        console.error(`Error al insertar usuario para tienda ${storeId}:`, err);
                    }
                });
            }

            storeInsertions++;
            if (storeInsertions === 20) {
                // Cerrar conexión tras completar todo
                setTimeout(() => {
                    connection.end((err) => {
                        if (err) {
                            console.error('Error al cerrar conexión:', err);
                        } else {
                            console.log('Conexión cerrada correctamente');
                        }
                    });
                }, 3000);
            }
        });
    }
});

/*PARA LLENAR LAS TIENDAS UNA POR UNA, IR CAMBIANDO EL PUERTO DEPENDIENDO DEL SHARD 
Y EL NOMBRE DE LA BASE DE DATOS DEPENDIENDO DE LA TIENDA:

const mysql = require('mysql2');
const { faker } = require('@faker-js/faker');

const connection = mysql.createConnection({
    host: '127.0.0.1',
    port: 3411, 
    user: 'root',
    password: 'securepassword',
    database: 'store_20' 
});

connection.connect(async (err) => {
    if (err) {
        console.error('Error al conectar:', err);
        return;
    }
    console.log('Conectado a store_20');

    // Insertar productos
    for (let i = 0; i < 500; i++) {
        const name = faker.commerce.productName();
        const price = faker.number.float({ min: 1, max: 1000, precision: 0.01 });
        const stock = faker.number.int({ min: 0, max: 500 });
        const category = faker.commerce.department();

        await connection.promise().query(
            'INSERT INTO products (name, price, stock, category) VALUES (?, ?, ?, ?)',
            [name, price, stock, category]
        );
    }
    console.log('500 productos insertados');

    // Obtener productos para usar sus IDs
    const [products] = await connection.promise().query('SELECT id, price FROM products');

    // Insertar ventas
    for (let i = 0; i < 400; i++) {
        const product = faker.helpers.arrayElement(products);
        const quantity = faker.number.int({ min: 1, max: 5 });
        const amount = product.price * quantity;
        const userId = faker.number.int({ min: 1, max: 5 }); // suponiendo 5 usuarios

        await connection.promise().query(
            'INSERT INTO sales (product_id, quantity, amount, user_id) VALUES (?, ?, ?, ?)',
            [product.id, quantity, amount, userId]
        );
    }
    console.log('400 ventas insertadas');

    // Insertar logs de inventario
    for (let i = 0; i < 250; i++) {
        const product = faker.helpers.arrayElement(products);
        const stockChange = faker.number.int({ min: -20, max: 20 });

        await connection.promise().query(
            'INSERT INTO inventory_logs (product_id, stock_change) VALUES (?, ?)',
            [product.id, stockChange]
        );
    }
    console.log('250 logs de inventario insertados');

    connection.end();
});
*/