const jwt = require('jsonwebtoken');

// Your JWT_SECRET from .env.local
const JWT_SECRET = 'YXN3aW46MTIzNA==';

// Your token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijk2Y2Q4NzZmLThlM2QtNDlmMS04NDFiLTgyMThiNTM1ZDMyOCIsImVtYWlsIjoic2hhcm9uYXN3aW4xMkBnbWFpbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjEwNzYxNTcsImV4cCI6MTc2MTE2MjU1N30.aHziv3zTpE8BgI3vXcI8auZIs0Zi1tnl5WerpAA03Io';

console.log('Testing JWT verification...');
console.log('JWT_SECRET:', JWT_SECRET);

try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token verification successful!');
    console.log('Decoded payload:', decoded);
} catch (error) {
    console.log('❌ Token verification failed!');
    console.log('Error:', error.message);

    // Try to decode without verification to see the payload
    try {
        const payload = jwt.decode(token);
        console.log('Token payload (unverified):', payload);
    } catch (decodeError) {
        console.log('Cannot decode token:', decodeError.message);
    }
}

// Test creating a new token with the same secret
console.log('\nTesting token creation...');
try {
    const testPayload = {
        id: 'test-id',
        email: 'test@example.com',
        role: 'admin'
    };

    const newToken = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '24h' });
    console.log('✅ New token created successfully!');
    console.log('New token:', newToken);

    // Verify the new token
    const verifiedNew = jwt.verify(newToken, JWT_SECRET);
    console.log('✅ New token verification successful!');
    console.log('New token payload:', verifiedNew);

} catch (error) {
    console.log('❌ Token creation/verification failed!');
    console.log('Error:', error.message);
}