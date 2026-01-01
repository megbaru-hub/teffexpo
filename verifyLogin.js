import http from 'http';

const data = JSON.stringify({
    email: 'admin@example.com',
    password: 'admin123'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, res => {
    let body = '';
    console.log(`Status Code: ${res.statusCode}`);

    res.on('data', d => {
        body += d;
    });

    res.on('end', () => {
        try {
            const parsed = JSON.parse(body);
            if (res.statusCode === 200 && parsed.token) {
                console.log('✅ Login Successful');
                console.log('Token received');
                console.log('User Role:', parsed.data.role);
                if (parsed.data.role === 'admin') {
                    console.log('✅ Role is ADMIN');
                } else {
                    console.log('❌ Role matches expected: NO (' + parsed.data.role + ')');
                }
            } else {
                console.log('❌ Login Failed');
                console.log('Response:', body);
            }
        } catch (e) {
            console.log('❌ Failed to parse response:', body);
        }
    });
});

req.on('error', error => {
    console.error('❌ Request Error:', error);
});

req.write(data);
req.end();
