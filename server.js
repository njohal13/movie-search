// Import depenedencies
const express = require('express')
const app = express()
const cors = require('cors')
const{ MongoClient, ObjectId } = require('mongodb')
require('dotenv').config()
const PORT = 5500


// Mongo connection
let db,
dbConnectionStr = process.env.DB_STRING,
dbName = 'sample_mflix',
collection

MongoClient.connect(dbConnectionStr)
    .then(client => {
        console.log('Connected to db')
        db = client.db(dbName)
        collection = db.collection('movies')
    })


// Middleware
app.use(express.urlencoded({extended : true}))
app.use(express.json())
app.use(cors())



// First get request to get autocomplete results
app.get("/search", async (request,response) => {
    try {
        // bundle together results from collection into array
        let result = await collection.aggregate([
            {
                "$search" : {
                    "autocomplete" : {
                        "query": `${request.query.query}`,
                        "path": "title",
                        "fuzzy": {
                            "maxEdits":2,
                            "prefixLength": 3
                        }
                    }
                }
            }
        ]).toArray()
        //console.log(result)
        // send result from db back to client
        response.send(result)
    } catch (error) {
        response.status(500).send({message: error.message})
        //console.log(error)
    }
})


// Second get request for our id paramater for the specific movie 
app.get('/get/:id', async (req, res) => {
    try {
        let result = await collection.findOne({
            "_id" : ObjectId(req.params.id)
        })
        res.send(result)
        
    } catch (error) {
        res.status(500).send({message: error.message})
    }

})


// Listen on PORT
app.listen(process.env.PORT || PORT, () => {
    console.log('Server is running')
})


//THIS IS THE INDEX TO APPLY TO MONGODB MOVIES COLLECTION
// {
//     "mappings": {
//         "dynamic": false,
//         "fields": {
//             "title": [
//                 {
//                     "foldDiacritics": false,
//                     "maxGrams": 7,
//                     "minGrams": 3,
//                     "tokenization": "edgeGram",
//                     "type": "autocomplete"
//                 }
//             ]
//         }
//     }
// }