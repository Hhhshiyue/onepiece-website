const jwt = require('jsonwebtoken');
const { getUserById } = require('../models/user');

const SECRET_KEY = process.env.JWT_SECRET || 'onepiece_jwt_secret_key_2024';
const EXPIRATION = '24h';

function generateToken(user) {
    return jwt.sign({ userId: user.id, username: user.username }, SECRET_KEY, { expiresIn: EXPIRATION });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (error) {
        return null;
    }
}

async function authenticate(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ success: false, message: '未提供token' });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
        return res.status(401).json({ success: false, message: 'token无效或已过期' });
    }
    
    const userResult = await getUserById(decoded.userId);
    
    if (!userResult.success) {
        return res.status(401).json({ success: false, message: '用户不存在' });
    }
    
    req.user = userResult.data;
    next();
}

async function optionalAuthenticate(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
        const decoded = verifyToken(token);
        
        if (decoded) {
            const userResult = await getUserById(decoded.userId);
            if (userResult.success) {
                req.user = userResult.data;
            }
        }
    }
    
    next();
}

module.exports = {
    generateToken,
    verifyToken,
    authenticate,
    optionalAuthenticate
};