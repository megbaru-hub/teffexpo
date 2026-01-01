import http from 'http';

// 1. Login as Merchant
const loginData = JSON.stringify({
    email: 'merchant@example.com',
    password: 'merchant123'
});

const loginOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/auth/merchant/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
};

const loginReq = http.request(loginOptions, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        try {
            if (res.statusCode !== 200) {
                console.log('❌ Merchant Login Failed:', body);
                return;
            }

            const parsed = JSON.parse(body);
            const token = parsed.token;

            console.log('✅ Merchant Login Successful');
            console.log('Token:', token ? 'Received' : 'Missing');
            console.log('Role:', parsed.data?.role);

            if (!token) return;

            // 2. Try to Create Product
            createProduct(token);

        } catch (e) {
            console.log('❌ Failed to parse login response:', e);
        }
    });
});

loginReq.write(loginData);
loginReq.end();

function createProduct(token) {
    const productData = JSON.stringify({
        teffType: 'White',
        pricePerKilo: 150,
        stockAvailable: 100,
        description: 'Test product from script'
    });

    const productOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/products',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': productData.length,
            'Authorization': `Bearer ${token}`
        }
    };

    const productReq = http.request(productOptions, res => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
            console.log(`Create Product Status: ${res.statusCode}`);
            if (res.statusCode === 201) {
                console.log('✅ Product Creation Successful');
            } else {
                console.log('❌ Product Creation Failed:', body);
            }
        });
    });

    productReq.write(productData);
    productReq.end();
}
