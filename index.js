require('dotenv').config();
const express = require('express');
const passport = require('passport');
const { BearerStrategy } = require('passport-azure-ad');
const axios = require('axios');
const querystring = require('querystring');
const path = require('path');
const bodyParser = require('body-parser');
const mongoAction = require('./lib/adapter');
const elasticOperation = require('./lib/ElasticSearch');

const port = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());

//handle error so that server doesnot crash
app.use((err, req, res, next) => {
    console.error('Error caught:', err);
    res.redirect('/error');
});

//express to use public folder
app.use(express.static(path.join(__dirname, 'public')));
console.log(process.env)
// Configure passport Azure AD
passport.use(new BearerStrategy({
    identityMetadata: `https://login.microsoftonline.com/${process.env.TENANT_ID}/v2.0/.well-known/openid-configuration`,
    clientID: process.env.CLIENT_ID,
    validateIssuer: true,
    loggingLevel: 'info',
    passReqToCallback: false
}, (token, done) => {
    done(null, token);
}));

app.use(passport.initialize());

app.get('/auth', (req, res) => {
    const authUrl = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&redirect_uri=${process.env.REDIRECT_URI}&response_mode=query&scope=openid profile offline_access email Mail.Read`;
    res.redirect(authUrl);
});

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
        })
            .catch((e) => {
                console.log("Caught error while fetching access token", e);
                res.json(e);
            })
        let accessToken = response.data.access_token;
        let refresh_token = response.data.refresh_token;
        let dbName = "users";
        let collection = "auth_details";
        let where = {
            "tenent_ID": process.env.TENANT_ID
        }

        let update = {
            "tenent_ID": process.env.TENANT_ID,
            "refresh_token": refresh_token,
            "accessToken": accessToken
        }
        //elastic operation to update the auth details
        await elasticOperation.updateDocument(collection, where.tenent_ID, update, upsert = true)
        //mongo operation to update  auth details in DB
        //await mongoAction.update(dbName, collection, where, update)
        console.log("**********Got aaccess_token from API ***************\n")
        res.redirect(`/emails?access_token=${accessToken}`);
    } catch (error) {
        next(error)
    }
});
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));

});

//get emails
app.get('/emails', async (req, res, next) => {
    const accessToken = req.query.access_token;
    if (!accessToken) {
        return res.status(401).send('Access token is missing');
    }
    try {
        axios.get('https://graph.microsoft.com/v1.0/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        })
            .then(async (response) => {
                console.log("Got profile response")
                let user = response.data || '';
                let dbName = 'users';
                let collection = 'user_details';
                let where = {
                    "email": user.mail
                };
                let update = {
                    "user": user,
                    "id": user.id,
                    "email": user.mail
                }
              //  await mongoAction.update(dbName, collection, where, update);
                await elasticOperation.updateDocument(collection, user.mail, update, upsert = true)
            })
            .catch((e) => {
                console.log("Error in getting response, ", e);
                next(e)
            })
    } catch (error) {
        console.log("Error in getting response, ", error);
        next(error)
    }

    res.sendFile(path.join(__dirname, 'public', 'emailTable.html'));
});


app.get('/fetchMails', async (req, res, next) => {
    let whereClause = { "tenent_ID": process.env.TENANT_ID };
    let dbName = 'users';
    let collection = "auth_details"
    let data = await mongoAction.fetch(dbName, collection, whereClause, {});
    var accessToken = data[0]["accessToken"];

    try {
        let mailFolder = await axios.get('https://graph.microsoft.com/v1.0/me/mailFolders', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        })
            .catch((e) => {
                console.log("Error in fetching email folders", e);
                next(e);
            })
        console.log(mailFolder);
        mailFolder = mailFolder && mailFolder.data && mailFolder.data.value ? mailFolder.data.value : [];
        for (var i = 0; i < mailFolder.length; i++) {
            mailFolder[i]['displayName'] = mailFolder[i]["displayName"].toLowerCase().replace(/\s+/g, '_')
            let collection = mailFolder[i]["displayName"];
            let id = mailFolder[i].id;
            let update = mailFolder[i];
            let output = await elasticOperation.updateDocument(collection, id, update, upsert = true);
            console.log(output)

        }

        axios.get('https://graph.microsoft.com/v1.0/me/messages', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        })
            .then(async (response) => {
                mailFolder
                let mailData = response && response.data && response.data.value ? response.data.value : [];
                mailData = mailData.map(mail => {
                    const folder = mailFolder.find(f => f.id == mail.parentFolderId);
                    return {
                        ...mail,
                        Folder: folder ? folder.displayName : null
                    };
                });

                let dbName = "mailInfo";
                let collection = "mails";
                for (var i = 0; i < mailData.length; i++) {
                    let where = { "bodyPreview": mailData[i].bodyPreview,
                        "subject": mailData[i].subject,
                     };
                    let update = {
                        "id": mailData[i].id+mailData[i].Folder,
                        "subject": mailData[i].subject,
                        "createdDateTime": mailData[i].createdDateTime,
                        "lastModifiedDateTime": mailData[i].lastModifiedDateTime,
                        "bodyPreview": mailData[i].bodyPreview,
                        "isRead": mailData[i].isRead,
                        "receivedDateTime": mailData[i].receivedDateTime,
                        "from": mailData[i].from.emailAddress.address,
                        "name": mailData[i].from.emailAddress.name,
                        "folder": mailData[i].Folder
                    };
                    await elasticOperation.updateDocument(collection, mailData[i].id+mailData[i].Folder, update, upsert = true)
                    //await mongoAction.update(dbName, collection, where, update)
                }
                var sort = [
                    {
                      ["receivedDateTime"]: {
                        order: "asc"
                      }
                    }
                  ]
                //fetch emails using mongodb
                //const emails = await mongoAction.fetch(dbName, collection, {}, sort);
                let query = {
                    "query" : {
                        match_all: {}
                      }
                }
                
             let emails = await elasticOperation.searchDocuments(collection, query,sort);
             let renderData = [];
             emails.forEach((ele)=>{
                renderData.push(ele._source)
             })
console.log("This is the email fetched using elastic seatch");
                res.json(renderData)

            })
            .catch(error => {
                console.log("Got an error while fetching mails: ", error)
                next(error)
            });
    } catch (error) {
        console.log("Got an error while fetching mails: ", error)
        next(error)
    }
});
// Route to handle errors
app.get('/error', (req, res) => {
    res.status(500).send('An error occurred while processing your request.');
});

app.listen(port, () => {
    console.log(`Server running on PORT :${port}`);
});
