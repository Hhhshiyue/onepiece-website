const { getDb, saveDatabase } = require('../database');

function getLatestVersion(dataType) {
    const db = getDb();
    
    return new Promise((resolve) => {
        try {
            db.get(
                'SELECT version, data, created_at FROM data_versions WHERE data_type = ? ORDER BY version DESC LIMIT 1',
                [dataType],
                (err, result) => {
                    if (err) {
                        resolve({ success: false, message: err.message });
                    } else if (!result) {
                        resolve({ success: false, message: '没有找到版本数据' });
                    } else {
                        resolve({ 
                            success: true, 
                            data: { 
                                version: result.version, 
                                data: JSON.parse(result.data), 
                                created_at: result.created_at 
                            } 
                        });
                    }
                }
            );
        } catch (error) {
            resolve({ success: false, message: error.message });
        }
    });
}

function saveVersion(dataType, data) {
    const db = getDb();
    
    return new Promise((resolve) => {
        try {
            db.get(
                'SELECT version FROM data_versions WHERE data_type = ? ORDER BY version DESC LIMIT 1',
                [dataType],
                (err, latest) => {
                    if (err) {
                        resolve({ success: false, message: err.message });
                        return;
                    }
                    
                    const newVersion = latest ? latest.version + 1 : 1;
                    
                    db.run(
                        'INSERT INTO data_versions (version, data_type, data) VALUES (?, ?, ?)',
                        [newVersion, dataType, JSON.stringify(data)],
                        async function(err) {
                            if (err) {
                                resolve({ success: false, message: err.message });
                            } else {
                                await saveDatabase();
                                resolve({ success: true, data: { version: newVersion, dataType } });
                            }
                        }
                    );
                }
            );
        } catch (error) {
            resolve({ success: false, message: error.message });
        }
    });
}

function getAllVersions(dataType = null) {
    const db = getDb();
    
    return new Promise((resolve) => {
        try {
            let query = 'SELECT id, version, data_type, created_at FROM data_versions';
            const params = [];
            
            if (dataType) {
                query += ' WHERE data_type = ?';
                params.push(dataType);
            }
            
            query += ' ORDER BY data_type, version DESC';
            
            db.all(query, params, (err, versions) => {
                if (err) {
                    resolve({ success: false, message: err.message });
                } else {
                    resolve({ success: true, data: versions });
                }
            });
        } catch (error) {
            resolve({ success: false, message: error.message });
        }
    });
}

function getVersion(dataType, version) {
    const db = getDb();
    
    return new Promise((resolve) => {
        try {
            db.get(
                'SELECT version, data, created_at FROM data_versions WHERE data_type = ? AND version = ?',
                [dataType, version],
                (err, result) => {
                    if (err) {
                        resolve({ success: false, message: err.message });
                    } else if (!result) {
                        resolve({ success: false, message: '版本不存在' });
                    } else {
                        resolve({ 
                            success: true, 
                            data: { 
                                version: result.version, 
                                data: JSON.parse(result.data), 
                                created_at: result.created_at 
                            } 
                        });
                    }
                }
            );
        } catch (error) {
            resolve({ success: false, message: error.message });
        }
    });
}

function deleteVersion(dataType, version) {
    const db = getDb();
    
    return new Promise((resolve) => {
        try {
            db.run('DELETE FROM data_versions WHERE data_type = ? AND version = ?', [dataType, version], async function(err) {
                if (err) {
                    resolve({ success: false, message: err.message });
                } else {
                    await saveDatabase();
                    resolve({ success: true, message: '版本已删除' });
                }
            });
        } catch (error) {
            resolve({ success: false, message: error.message });
        }
    });
}

function compareVersions(dataType, version1, version2) {
    const db = getDb();
    
    return new Promise((resolve) => {
        try {
            db.get(
                'SELECT data FROM data_versions WHERE data_type = ? AND version = ?',
                [dataType, version1],
                (err, v1) => {
                    if (err) {
                        resolve({ success: false, message: err.message });
                        return;
                    }
                    
                    db.get(
                        'SELECT data FROM data_versions WHERE data_type = ? AND version = ?',
                        [dataType, version2],
                        (err, v2) => {
                            if (err) {
                                resolve({ success: false, message: err.message });
                                return;
                            }
                            
                            if (!v1 || !v2) {
                                resolve({ success: false, message: '版本不存在' });
                                return;
                            }
                            
                            const data1 = JSON.parse(v1.data);
                            const data2 = JSON.parse(v2.data);
                            
                            const changes = {
                                added: [],
                                removed: [],
                                modified: []
                            };
                            
                            if (Array.isArray(data1) && Array.isArray(data2)) {
                                const map1 = new Map(data1.map(item => [item.name || item.title || JSON.stringify(item), item]));
                                const map2 = new Map(data2.map(item => [item.name || item.title || JSON.stringify(item), item]));
                                
                                map2.forEach((item, key) => {
                                    if (!map1.has(key)) {
                                        changes.added.push(item);
                                    }
                                });
                                
                                map1.forEach((item, key) => {
                                    if (!map2.has(key)) {
                                        changes.removed.push(item);
                                    }
                                });
                            }
                            
                            resolve({ success: true, data: changes });
                        }
                    );
                }
            );
        } catch (error) {
            resolve({ success: false, message: error.message });
        }
    });
}

function cleanOldVersions(dataType, keepCount = 5) {
    const db = getDb();
    
    return new Promise((resolve) => {
        try {
            db.all(
                'SELECT version FROM data_versions WHERE data_type = ? ORDER BY version DESC LIMIT -1 OFFSET ?',
                [dataType, keepCount],
                (err, versions) => {
                    if (err) {
                        resolve({ success: false, message: err.message });
                        return;
                    }
                    
                    let deletedCount = 0;
                    versions.forEach(v => {
                        db.run('DELETE FROM data_versions WHERE data_type = ? AND version = ?', [dataType, v.version], () => {
                            deletedCount++;
                        });
                    });
                    
                    saveDatabase().then(() => {
                        resolve({ success: true, message: `已清理 ${deletedCount} 个旧版本` });
                    });
                }
            );
        } catch (error) {
            resolve({ success: false, message: error.message });
        }
    });
}

module.exports = {
    getLatestVersion,
    saveVersion,
    getAllVersions,
    getVersion,
    deleteVersion,
    compareVersions,
    cleanOldVersions
};