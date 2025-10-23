const axios = require('axios');

async function testAuthentication() {
    try {
        console.log('🔍 Testing Authentication Flow...\n');

        // Step 1: Register a user
        console.log('1. Registering user...');
        const registerResponse = await axios.post('http://localhost:6001/auth/register', {
            email: 'debug@test.com',
            password: 'password123',
            firstName: 'Debug',
            lastName: 'User',
            role: 'customer'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-client-id': 'debug-client'
            }
        });

        console.log('✅ Registration successful');
        console.log('Token received:', registerResponse.data.data?.token ? 'Yes' : 'No');

        const token = registerResponse.data.data?.token;
        if (!token) {
            console.log('❌ No token received from registration');
            return;
        }

        // Step 2: Verify token directly with user-management service
        console.log('\n2. Verifying token with user-management service...');
        try {
            const verifyResponse = await axios.post('http://localhost:6001/auth/verify', {}, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-client-id': 'debug-client'
                }
            });
            console.log('✅ Direct token verification successful');
            console.log('User data:', verifyResponse.data.data);
        } catch (verifyError) {
            console.log('❌ Direct token verification failed');
            console.log('Error:', verifyError.response?.data || verifyError.message);
            return;
        }

        // Step 3: Test with categories service
        console.log('\n3. Testing with categories service...');
        try {
            const categoriesResponse = await axios.get('http://localhost:6003/categories', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-client-id': 'debug-client'
                }
            });
            console.log('✅ Categories service access successful');
        } catch (categoriesError) {
            console.log('❌ Categories service access failed');
            console.log('Error:', categoriesError.response?.data || categoriesError.message);

            // Check if it's a connection error
            if (categoriesError.code === 'ECONNREFUSED') {
                console.log('💡 Categories service is not running on port 6003');
            }
        }

        // Step 4: Test with products service
        console.log('\n4. Testing with products service...');
        try {
            const productsResponse = await axios.get('http://localhost:6002/products', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-client-id': 'debug-client'
                }
            });
            console.log('✅ Products service access successful');
        } catch (productsError) {
            console.log('❌ Products service access failed');
            console.log('Error:', productsError.response?.data || productsError.message);

            if (productsError.code === 'ECONNREFUSED') {
                console.log('💡 Products service is not running on port 6002');
            }
        }

    } catch (error) {
        console.log('❌ Test failed');
        console.log('Error:', error.response?.data || error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('💡 User management service is not running on port 6001');
        }
    }
}

// Run the test
testAuthentication();