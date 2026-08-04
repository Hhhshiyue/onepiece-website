const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

let db = null;

function initDatabase() {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }
        
        try {
            const dbPath = path.join(__dirname, 'data', 'onepiece.db');
            const exists = fs.existsSync(dbPath);
            
            db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                    return;
                }
                
                // 始终确保表存在
                createTables();
                
                console.log('SQLite database initialized successfully');
                resolve(db);
            });
        } catch (error) {
            console.error('Error initializing database:', error);
            reject(error);
        }
    });
}

function createTables() {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE,
            password TEXT NOT NULL,
            avatar TEXT,
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            updated_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
    `);
    
    db.run(`
        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            item_id TEXT NOT NULL,
            item_name TEXT NOT NULL,
            item_image TEXT,
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, type, item_id)
        )
    `);
    
    db.run(`
        CREATE TABLE IF NOT EXISTS data_versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version INTEGER NOT NULL,
            data_type TEXT NOT NULL,
            data TEXT NOT NULL,
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
    `);
    
    db.run(`
        CREATE TABLE IF NOT EXISTS crawl_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'pending',
            error_message TEXT,
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
    `);
}

function saveDatabase() {
    return new Promise((resolve) => {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err);
                resolve(false);
                return;
            }
            
            const dbPath = path.join(__dirname, 'data', 'onepiece.db');
            db = new sqlite3.Database(dbPath, () => {
                resolve(true);
            });
        });
    });
}

function closeDatabase() {
    if (db) {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err);
            } else {
                console.log('Database closed successfully');
            }
        });
        db = null;
    }
}

module.exports = {
    initDatabase,
    saveDatabase,
    closeDatabase,
    getDb: () => db
};