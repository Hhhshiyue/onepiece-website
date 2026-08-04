const { getDb } = require('../database');

function addFavorite(userId, type, itemId, itemName, itemImage = null) {
    const db = getDb();
    
    return new Promise((resolve) => {
        try {
            db.run(
                'INSERT OR IGNORE INTO favorites (user_id, type, item_id, item_name, item_image) VALUES (?, ?, ?, ?, ?)',
                [userId, type, itemId, itemName, itemImage],
                async function(err) {
                    if (err) {
                        resolve({ success: false, message: err.message });
                        return;
                    }
                    
                    // SQLite 直接写入磁盘，不需要手动保存
                    db.get('SELECT * FROM favorites WHERE user_id = ? AND type = ? AND item_id = ?', [userId, type, itemId], (err, favorite) => {
                        if (err) {
                            resolve({ success: false, message: err.message });
                        } else {
                            resolve({ success: true, data: favorite });
                        }
                    });
                }
            );
        } catch (error) {
            resolve({ success: false, message: error.message });
        }
    });
}

function removeFavorite(userId, type, itemId) {
    const db = getDb();
    
    return new Promise((resolve) => {
        try {
            db.run('DELETE FROM favorites WHERE user_id = ? AND type = ? AND item_id = ?', [userId, type, itemId], async function(err) {
                if (err) {
                    resolve({ success: false, message: err.message });
                } else {
                    // SQLite 直接写入磁盘，不需要手动保存
                    resolve({ success: true, message: '收藏已取消' });
                }
            });
        } catch (error) {
            resolve({ success: false, message: error.message });
        }
    });
}

function getFavoritesByUser(userId, type = null) {
    const db = getDb();
    
    return new Promise((resolve) => {
        try {
            let query = 'SELECT * FROM favorites WHERE user_id = ?';
            const params = [userId];
            
            if (type) {
                query += ' AND type = ?';
                params.push(type);
            }
            
            query += ' ORDER BY created_at DESC';
            
            db.all(query, params, (err, favorites) => {
                if (err) {
                    resolve({ success: false, message: err.message });
                } else {
                    resolve({ success: true, data: favorites });
                }
            });
        } catch (error) {
            resolve({ success: false, message: error.message });
        }
    });
}

function isFavorite(userId, type, itemId) {
    const db = getDb();
    
    return new Promise((resolve) => {
        try {
            db.get('SELECT id FROM favorites WHERE user_id = ? AND type = ? AND item_id = ?', [userId, type, itemId], (err, favorite) => {
                if (err) {
                    resolve({ success: false, message: err.message });
                } else {
                    resolve({ success: true, data: !!favorite });
                }
            });
        } catch (error) {
            resolve({ success: false, message: error.message });
        }
    });
}

function getFavoriteCount(userId, type = null) {
    const db = getDb();
    
    return new Promise((resolve) => {
        try {
            let query = 'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?';
            const params = [userId];
            
            if (type) {
                query += ' AND type = ?';
                params.push(type);
            }
            
            db.get(query, params, (err, result) => {
                if (err) {
                    resolve({ success: false, message: err.message });
                } else {
                    resolve({ success: true, data: { count: result.count || 0 } });
                }
            });
        } catch (error) {
            resolve({ success: false, message: error.message });
        }
    });
}

function getFavoriteItems(userId, type) {
    const db = getDb();
    
    return new Promise((resolve) => {
        try {
            db.all(
                'SELECT item_id, item_name, item_image FROM favorites WHERE user_id = ? AND type = ? ORDER BY created_at DESC',
                [userId, type],
                (err, favorites) => {
                    if (err) {
                        resolve({ success: false, message: err.message });
                    } else {
                        resolve({ success: true, data: favorites });
                    }
                }
            );
        } catch (error) {
            resolve({ success: false, message: error.message });
        }
    });
}

module.exports = {
    addFavorite,
    removeFavorite,
    getFavoritesByUser,
    isFavorite,
    getFavoriteCount,
    getFavoriteItems
};