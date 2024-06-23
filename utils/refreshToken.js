require('dotenv').config
const querystring = require('querystring');
const axios = require('axios');
const elasticOperation = require('../lib/ElasticSearch'); // Elasticsearch operations



const refreshAccessToken = async (refreshToken) => {
    const params = querystring.stringify({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        redirect_uri: process.env.REDIRECT_URI
    });

    try {
        const response = await axios.post(`https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token: newAccessToken, refresh_token: newRefreshToken } = response.data;

        // Update tokens in the database
        const update = {
            tenent_ID: process.env.TENANT_ID,
            refresh_token: newRefreshToken || refreshToken, // Use new refresh token if provided, otherwise keep the old one
            accessToken: newAccessToken
        };
        await elasticOperation.updateDocument('auth_details', process.env.TENANT_ID, update, true);

        return newAccessToken;
    } catch (error) {
        console.log("Error refreshing access token:", error);
        throw error;
    }
};


module.exports = refreshAccessToken