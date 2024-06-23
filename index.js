require('dotenv').config();
const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const path = require('path');
const bodyParser = require('body-parser');
const elasticOperation = require('./lib/ElasticSearch'); // Elasticsearch operations
var refreshAccessToken = require("./utils/refreshToken")
const port = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());

// Error handling middleware to prevent server crashes
app.use((err, req, res, next) => {
    console.error('Error caught:', err);
    res.redirect('/error');
});

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Redirect to Microsoft OAuth2 authorization endpoint
app.get('/auth', (req, res) => {
    const authUrl = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&redirect_uri=${process.env.REDIRECT_URI}&response_mode=query&scope=openid profile offline_access email Mail.Read`;
    res.redirect(authUrl);
});

// Callback endpoint for OAuth2 authentication
app.get('/auth/outlook/callback', async (req, res, next) => {
    const code = req.query.code;
    const params = querystring.stringify({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: 'authorization_code'
    });

    try {
        const response = await axios.post(`https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token: accessToken, refresh_token: refreshToken } = response.data;

        const update = {
            tenent_ID: process.env.TENANT_ID,
            refresh_token: refreshToken,
            accessToken: accessToken
        };

        // Upsert auth details into Elasticsearch
        await elasticOperation.updateDocument('auth_details', process.env.TENANT_ID, update, true);

        console.log("**********Got access_token from API ***************\n");
        res.redirect(`/emails?access_token=${accessToken}`);
    } catch (error) {
        console.log("Caught error while fetching access token", error);
        next(error);
    }
});

// Serve the home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Fetch emails using the provided access token
app.get('/emails', async (req, res, next) => {
    const accessToken = req.query.access_token;
    if (!accessToken) {
        return res.status(401).send('Access token is missing');
    }

    try {
        const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const user = response.data;
        const update = {
            user: user,
            id: user.id,
            email: user.mail
        };

        // Upsert user details into Elasticsearch
        await elasticOperation.updateDocument('user_details', user.mail, update, true);

        res.sendFile(path.join(__dirname, 'public', 'emailTable.html'));
    } catch (error) {
        console.log("Error in getting response,", error);
        next(error);
    }
});

// Fetch and update email folders and messages
app.get('/fetchMails', async (req, res, next) => {
    try {
        const authData = await elasticOperation.searchDocumentById('auth_details', process.env.TENANT_ID);
        let accessToken = authData.accessToken;
        const refreshToken = authData.refresh_token;

        // Fetch email folders
         try {
            var folderResponse = await axios.get('https://graph.microsoft.com/v1.0/me/mailFolders', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
        } catch (tokenError) {
            // If token is invalid or expired, refresh it
            if (tokenError.response && tokenError.response.status === 401) {
                console.log("Access token expired, refreshing token...");
                accessToken = await refreshAccessToken(refreshToken);
                var folderResponse = await axios.get('https://graph.microsoft.com/v1.0/me/mailFolders', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
            } else {
                throw tokenError;
            }
        }

        let mailFolders = folderResponse.data.value || [];
        mailFolders = await Promise.all(mailFolders.map(async (folder) => {
            folder.displayName = folder.displayName.toLowerCase().replace(/\s+/g, '_');
            await elasticOperation.updateDocument(folder.displayName, folder.id, folder, true);
            return folder;
        }));

        // Fetch all emails
        let mailData = [];
        let nextLink = 'https://graph.microsoft.com/v1.0/me/messages';
        while (nextLink) {
            const response = await axios.get(nextLink, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            mailData = mailData.concat(response.data.value);
            nextLink = response.data['@odata.nextLink'] || null;
        }

        // Assign folders to emails
        mailData = mailData.map(mail => {
            const folder = mailFolders.find(f => f.id === mail.parentFolderId);
            return { ...mail, Folder: folder ? folder.displayName : null };
        });

        // Prepare datasets for bulk upsert
        const datasets = mailData.map(mail => ({
            id: mail.bodyPreview+ mail.subject,
            subject: mail.subject,
            createdDateTime: mail.createdDateTime,
            lastModifiedDateTime: mail.lastModifiedDateTime,
            bodyPreview: mail.bodyPreview,
            isRead: mail.isRead,
            receivedDateTime: mail.receivedDateTime,
            from: mail.from.emailAddress.address,
            name: mail.from.emailAddress.name,
            folder: mail.Folder
        }));

        // Bulk upsert email data into Elasticsearch
        await elasticOperation.bulkUpsert('mails', datasets);

        // Fetch all emails from Elasticsearch
        const emails = await elasticOperation.searchDocuments('mails', {
            query: { match_all: {} }
        }, [
            { receivedDateTime: { order: "asc" } }
        ]);

        const renderData = emails.map(email => email._source);
        console.log("This is the email fetched using Elasticsearch");
        res.json(renderData);
    } catch (error) {
        console.log("Got an error while fetching mails:", error);
        next(error);
    }
});

// Error handling route
app.get('/error', (req, res) => {
    res.status(500).send('An error occurred while processing your request.');
});

// Fetch user information from Elasticsearch
app.get('/fetchUserInfo', async (req, res, next) => {
    try {
        const user = await elasticOperation.searchDocuments('user_details', { query: { match_all: {} } });
        const userData = {
            name: user[0]._source.user.displayName,
            email: user[0]._source.user.mail
        };
        res.json(userData);
    } catch (error) {
        console.log("Got error in finding userData", error);
        next(error);
    }
});

app.listen(port, () => {
    console.log(`Server running on PORT: ${port}`);
});
