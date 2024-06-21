require('dotenv').config()
const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: process.env.ELASTIC_SEARCH_URI });

// Check the connection
async function checkConnection() {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await client.cluster.health({});
            console.log('Elasticsearch cluster is connected:', response);
        } catch (error) {
            console.error('Elasticsearch connection error:', error);
            return reject("Unable to set connection with ElasticSearch")

        }

    })
}

async function indexDocument(index, id, document) {
    return new Promise((resolve, reject) => {
        client.index({
            index,
            id,
            body: document
        })
            .then((response) => {
                console.log('Document indexed:', response);
                return resolve(response);
            })
            .catch((error) => {
                console.error('Indexing error:', error);
                return reject(error);
            })
    })

}

// Example document
const document = {
    title: 'Elasticsearch with Node.js',
    content: 'This is a sample document for Elasticsearch.',
    timestamp: new Date()
};

//indexDocument('my_index', '1', document);


async function searchDocuments(index, query) {
    try {
        const response = await client.search({
            index,
            body: {
                query
            }
        });
        console.log('Search results:', response.hits.hits);
    } catch (error) {
        console.error('Search error:', error);
    }
}

// Example search query
const query = {
    match: {
        title: 'Elasticsearch'
    }
};

//searchDocuments('my_index', query);


async function getDocument(index, id) {
    try {
        const response = await client.get({
            index,
            id
        });
        console.log('Document retrieved:', response);
    } catch (error) {
        console.error('Get document error:', error);
    }
}

//getDocument('my_index', '1');

async function updateDocument(index, id, document , upsert) {
    try {
        upsert = upsert == true ? true : false
        console.log("upsert operation is : ", upsert)
        const response = await client.update({
            index,
            id,
            body: {
                doc: document,
                doc_as_upsert: true
            }
        });
        console.log('Document updated:', response);
        return true;
    } catch (error) {
        console.error('Update error:', error);
        return (error)
    }
}

// Example update
const updatedFields = {
    title: 'Updated Elasticsearch with Node.js'
};

//updateDocument('my_index', '1', updatedFields);


module.exports = {
    "checkConnection": checkConnection,
    "indexDocument": indexDocument,
    "updateDocument": updateDocument,
    "searchDocuments": searchDocuments

}

