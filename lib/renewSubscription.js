const renewSubscription = (subscriptionId, accessToken) => {
    const newExpirationDateTime = new Date(new Date().getTime() + 3600 * 1000).toISOString(); // 1 hour from now

    axios.patch(`https://graph.microsoft.com/v1.0/subscriptions/${subscriptionId}`, {
        expirationDateTime: newExpirationDateTime
    }, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('Subscription renewed:', response.data);
    })
    .catch(error => {
        console.error('Error renewing subscription:', error.response.data);
    });
};

// Example usage
const subscriptionId = 'your_subscription_id'; // Replace with your subscription ID
renewSubscription(subscriptionId, accessToken);
