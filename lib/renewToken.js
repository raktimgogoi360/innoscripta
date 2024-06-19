const refreshToken = async () => {
    const params = querystring.stringify({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        refresh_token: 'your_refresh_token',
        grant_type: 'refresh_token',
        redirect_uri: process.env.REDIRECT_URI
    });

    try {
        const response = await axios.post(`https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return response.data.access_token;
    } catch (error) {
        console.error('Error refreshing token:', error.response.data);
    }
};
