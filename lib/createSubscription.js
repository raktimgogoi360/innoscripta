require('dotenv').config
const axios = require('axios');
async function subscription(accessToken) {
    const subscriptionEndpoint = `${process.env.BASE_URL}/api/notifications`; // Replace with your endpoint
    const subscriptionData = {
        changeType: 'created,updated,deleted',
        notificationUrl: subscriptionEndpoint,
        resource: '/me/messages',
        expirationDateTime: new Date(new Date().getTime() + 3600 * 1000).toISOString(), // 1 hour from now
    };

    axios.post('https://graph.microsoft.com/v1.0/subscriptions', subscriptionData, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    })  
        .then(response => {
            console.log('Subscription created:', response.data);
            return (response.data);
        })
        .catch(error => {
            console.error('Error creating subscription:', error.response.data);
        });

}
module.exports = subscription