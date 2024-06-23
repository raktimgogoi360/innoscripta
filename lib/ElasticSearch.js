require('dotenv').config()
const { Client } = require('@elastic/elasticsearch');
const axios = require('axios');

const client = new Client({ node: process.env.ELASTIC_SEARCH_URI });

async function searchDocuments(index, query,sort) {
    
    try {
        let request = {
            index: index,
            body: 
                query, 
                size: 100,       

        }
        if (sort){
            request.body["sort"] = sort
        }
        const response = await client.search(request);
        console.log('Search results:', response.hits.hits);
            return (response.hits.hits)
    } catch (error) {
        console.error('Search error:', error);
    }
}

async function updateDocument(index, id, document) {
    try {
        const response = await client.update({
            index: index,
            id: id,
            body: {
                doc: document,
                doc_as_upsert: true
            },
            refresh: 'true'
        });
        console.log(`Upsert successful for ID: ${id}`, response);
        return true;
    } catch (error) {
        console.error('Update error:', error);
        return error;
    }
}



//find documents on the basis of id

async function searchDocumentById(index, id) {
    try {
      const result = await client.get({
        index: index,
        id: id
      });
      console.log('Document found:', result._source);
      return (result._source);
    } catch (error) {
      if (error.meta.statusCode === 404) {
        console.log('Document not found');
      } else {
        console.error('Error searching document:', error);
      }
    }
  }

  async function bulkUpsert(index, documents) {
    const body = documents.flatMap(doc => [
        { update: { _index: index, _id: doc.id } },
        { doc: doc, doc_as_upsert: true }
    ]);

    try {
        const { body: bulkResponse } = await client.bulk({ refresh: 'true', body });
            console.log('Bulk upsert successful');
            return true
    } catch (error) {
        console.error('Bulk upsert error:', error);
    }
}
  
module.exports = {

    "updateDocument": updateDocument,
    "searchDocuments": searchDocuments,
    "searchDocumentById" : searchDocumentById,
    "bulkUpsert" : bulkUpsert

}

