const { MongoClient } = require('mongodb');
require('dotenv').config

async function update(dbName, coll, where, update) {

    let url = process.env.MONGO_URI
    if (process.env.MONGO_AUTH == true) {
        url = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URI}`; // Change this to your MongoDB server URL
    }
    // Create a new MongoClient
    const client = new MongoClient(url, { });

    async function main() {
        // Use connect method to connect to the server
        try {
            await client.connect();
            console.log('Connected successfully to mongo server');

            const db = client.db(dbName);

            // Use the db for CRUD operations
            let collection = db.collection(coll);
            // Insert some documents
            const UpdateResult = await collection.updateOne(where,
                {
                    $set: update
                },
                {
                    upsert: true
                }
            );
            console.log('Update documents =>', UpdateResult);

        } catch (err) {
            console.error(err);
        } finally {
            // Close the connection to the database server
            await client.close();
        }
        return true
    }

    await main().catch(console.error);
}



async function fetch(dbName, coll, where,sort) {

    let url = process.env.MONGO_URI
    if (process.env.MONGO_AUTH == true) {
        url = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URI}`; // Change this to your MongoDB server URL
    }
    // Create a new MongoClient
    const client = new MongoClient(url, { });

   
        return new Promise(async(resolve,reject)=>{
        try {
            await client.connect();
            console.log('Connected successfully to server');
            const db = client.db(dbName);
            // Use the db for CRUD operations
            let collection = db.collection(coll);
            // Insert some documents
            var find = await collection.find(where).sort(sort).toArray();
            await client.close();
            return resolve(find);

        } catch (err) {
            console.error(err);
            reject (err)
        } 

        })

   
}


module.exports = {
    "update": update,
    "fetch": fetch
}