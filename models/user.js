const { getDb } = require('../database');
const bcrypt = require('bcryptjs');

async function createUser(username, password, email = null) {
    const db = getDb();
    
    return new Promise((resolve) => {
        // 先检查用户名是否存在
        db.get('SELECT id FROM users WHERE username = ?', [username], async (err, existingUsername) => {
            if (err) {
                resolve({ success: false, message: err.message });
                return;
            }
            
            if (existingUsername) {
                resolve({ success: false, message: '用户名已存在' });
                return;
            }
            
            // 如果提供了邮箱，检查邮箱是否存在
            if (email) {
                db.get('SELECT id FROM users WHERE email = ?', [email], async (err, existingEmail) => {
                    if (err) {
                        resolve({ success: false, message: err.message });
                        return;
                    }
                    
                    if (existingEmail) {
                        resolve({ success: false, message: '邮箱已存在' });
                        return;
                    }
                    
                    // 创建用户
                    await insertUser(db, username, password, email, resolve);
                });
            } else {
                // 没有邮箱，直接创建用户
                await insertUser(db, username, password, null, resolve);
            }
        });
    });
}

async function insertUser(db, username, password, email, resolve) {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword],
            async function(err) {
                if (err) {
                    resolve({ success: false, message: err.message });
                    return;
                }
                
                // SQLite 直接写入磁盘，不需要手动保存
                db.get('SELECT id, username, email, created_at FROM users WHERE username = ?', [username], (err, user) => {
                    if (err) {
                        resolve({ success: false, message: err.message });
                    } else {
                        resolve({ success: true, data: user });
                    }
                });
            }
        );
    } catch (error) {
        resolve({ success: false, message: error.message });
    }
}

async function loginUser(username, password) {
    const db = getDb();
    
    return new Promise((resolve) => {
        db.get('SELECT id, username, email, password FROM users WHERE username = ? OR email = ?', [username, username], async (err, user) => {
            if (err) {
                resolve({ success: false, message: err.message });
                return;
            }
            
            if (!user) {
                resolve({ success: false, message: '用户不存在' });
                return;
            }
            
            try {
                const isValid = await bcrypt.compare(password, user.password);
                
                if (!isValid) {
                    resolve({ success: false, message: '密码错误' });
                    return;
                }
                
                resolve({ 
                    success: true, 
                    data: { 
                        id: user.id, 
                        username: user.username, 
                        email: user.email 
                    } 
                });
            } catch (error) {
                resolve({ success: false, message: error.message });
            }
        });
    });
}

function getUserById(id) {
    const db = getDb();
    
    return new Promise((resolve) => {
        db.get('SELECT id, username, email, avatar, created_at FROM users WHERE id = ?', [id], (err, user) => {
            if (err) {
                resolve({ success: false, message: err.message });
            } else if (!user) {
                resolve({ success: false, message: '用户不存在' });
            } else {
                resolve({ success: true, data: user });
            }
        });
    });
}

function getUserByUsername(username) {
    const db = getDb();
    
    return new Promise((resolve) => {
        db.get('SELECT id, username, email, avatar, created_at FROM users WHERE username = ?', [username], (err, user) => {
            if (err) {
                resolve({ success: false, message: err.message });
            } else if (!user) {
                resolve({ success: false, message: '用户不存在' });
            } else {
                resolve({ success: true, data: user });
            }
        });
    });
}

function updateUser(id, updates) {
    const db = getDb();
    
    return new Promise((resolve) => {
        try {
            const fields = [];
            const values = [];
            
            if (updates.email) {
                fields.push('email = ?');
                values.push(updates.email);
            }
            if (updates.avatar) {
                fields.push('avatar = ?');
                values.push(updates.avatar);
            }
            
            values.push(id);
            
            db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values, async function(err) {
                if (err) {
                    resolve({ success: false, message: err.message });
                    return;
                }
                
                // SQLite 直接写入磁盘，不需要手动保存
                db.get('SELECT id, username, email, avatar, created_at FROM users WHERE id = ?', [id], (err, user) => {
                    if (err) {
                        resolve({ success: false, message: err.message });
                    } else {
                        resolve({ success: true, data: user });
                    }
                });
            });
        } catch (error) {
            resolve({ success: false, message: error.message });
        }
    });
}

async function updatePassword(id, oldPassword, newPassword) {
    const db = getDb();
    
    return new Promise((resolve) => {
        db.get('SELECT password FROM users WHERE id = ?', [id], async (err, user) => {
            if (err) {
                resolve({ success: false, message: err.message });
                return;
            }
            
            if (!user) {
                resolve({ success: false, message: '用户不存在' });
                return;
            }
            
            try {
                const isValid = await bcrypt.compare(oldPassword, user.password);
                
                if (!isValid) {
                    resolve({ success: false, message: '原密码错误' });
                    return;
                }
                
                const hashedPassword = await bcrypt.hash(newPassword, 10);
                
                db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id], async function(err) {
                    if (err) {
                        resolve({ success: false, message: err.message });
                    } else {
                        // SQLite 直接写入磁盘，不需要手动保存
                        resolve({ success: true, message: '密码更新成功' });
                    }
                });
            } catch (error) {
                resolve({ success: false, message: error.message });
            }
        });
    });
}

function deleteUser(id) {
    const db = getDb();
    
    return new Promise((resolve) => {
        try {
            db.run('DELETE FROM favorites WHERE user_id = ?', [id], (err) => {
                if (err) {
                    resolve({ success: false, message: err.message });
                    return;
                }
                
                db.run('DELETE FROM users WHERE id = ?', [id], async function(err) {
                    if (err) {
                        resolve({ success: false, message: err.message });
                    } else {
                        // SQLite 直接写入磁盘，不需要手动保存
                        resolve({ success: true, message: '用户删除成功' });
                    }
                });
            });
        } catch (error) {
            resolve({ success: false, message: error.message });
        }
    });
}

function getAllUsers() {
    const db = getDb();
    
    return new Promise((resolve) => {
        db.all('SELECT id, username, email, avatar, created_at FROM users', (err, users) => {
            if (err) {
                resolve({ success: false, message: err.message });
            } else {
                resolve({ success: true, data: users });
            }
        });
    });
}

module.exports = {
    createUser,
    loginUser,
    getUserById,
    getUserByUsername,
    updateUser,
    updatePassword,
    deleteUser,
    getAllUsers
};