const crypto = require('crypto');

const base64url = (input) =>
    Buffer.from(input)
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

const decodeBase64Url = (input) => {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return Buffer.from(padded, 'base64').toString('utf8');
};

const parseExpiryToSeconds = (value) => {
    if (!value) return 60 * 60 * 24 * 7;
    if (/^\d+$/.test(value)) return Number(value);

    const match = String(value).match(/^(\d+)([smhd])$/i);
    if (!match) return 60 * 60 * 24 * 7;

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
    return amount * multipliers[unit];
};

const signJwt = (payload, secret, expiresIn) => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const fullPayload = {
        ...payload,
        iat: now,
        exp: now + parseExpiryToSeconds(expiresIn)
    };

    const encodedHeader = base64url(JSON.stringify(header));
    const encodedPayload = base64url(JSON.stringify(fullPayload));
    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto
        .createHmac('sha256', secret)
        .update(data)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    return `${data}.${signature}`;
};

const verifyJwt = (token, secret) => {
    const [encodedHeader, encodedPayload, providedSignature] = String(token || '').split('.');
    if (!encodedHeader || !encodedPayload || !providedSignature) {
        throw new Error('Invalid token format');
    }

    const data = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(data)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    if (!crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature))) {
        throw new Error('Invalid token signature');
    }

    const payload = JSON.parse(decodeBase64Url(encodedPayload));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
    }

    return payload;
};

module.exports = {
    signJwt,
    verifyJwt,
    parseExpiryToSeconds
};
