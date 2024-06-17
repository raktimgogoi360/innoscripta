const setting = require("../utils/settings").variables;
const { Client } = require('@elastic/elasticsearch')
const client = new Client({
    node: "http://localhost:9200", auth: {
        username: 'elastic',
        password: 'admin@123'
    }
}); // Replace with your Elasticsearch server URL

async function adapters(user) {
    try {
        // client.info()
        //     .then(response =>
        //         console.log(response))
        //     .catch(error => console.error(error))
         
        //     client.ping((error) => {
        //     if (error) {
        //         console.log('elasticsearch cluster is down!');
        //     } 
        //     console.log('All is well');
        // });
        async function write() {
            await client.index({
            index: 'users',
            body: user,
            id : user.id,
            
        })
        await client.indices.refresh({index: 'users'})
    }
    await write().catch(console.log)
        async function read() {
            const { body } = await client.search({
              index: 'users',
              
            })
            console.log(body)
          }
          
         await read().catch(console.log)
           // return response;
    } catch (error) {
        console.error(`Error inserting document: ${error}`);
        throw error;
    }
}


module.exports = {
    "adpater": adapters
}