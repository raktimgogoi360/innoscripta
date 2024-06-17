let variables = require('dotenv').config({
    path: `${__dirname}/../.env`
})

// configure global varaibles
function settings() {
        let environVariables = variables.parsed ? variables.parsed : {};
    let config = {};
    //check if Authentication is present for Outlook then form JSON
    if (environVariables.OUTLOOK_AUTHENTICATION && environVariables.OUTLOOK_AUTHENTICATION == 'true') {
        config["outlookConfig"] = {
            client_id: environVariables.CLIENT_ID_OUTLOOK,
            client_secret: environVariables.CLIENT_SECRET_OUTLOOK,
            tenant_id: environVariables.TENANT_ID_OUTLOOK,
            rediect_url: environVariables.REDIRECT_URI_OUTLOOK,
            identityMetadata : environVariables.IDENTITY_META_DATA
        }

    }
    //check if Authenticaiton is present for Gmail then form JSON
    else if (environVariables.GMAIL_AUTHENTICATION && environVariables.GMAIL_AUTHENTICATION == 'true') {
        config["gmailConfig"] = {
            client_id: environVariables.CLIENT_ID_GMAIL,
            client_secret: environVariables.CLIENT_SECRET_GMAIL,
            rediect_url: environVariables.REDIRECT_URI_GMAIL
            
        }
    }
    config["PORT"] = environVariables.PORT;
    config["ELASTICSEARCH"] = environVariables.ELASTICSEARCH
    return (config)
}

module.exports = {
    "variables" : settings()
}