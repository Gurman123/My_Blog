import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname,'/build')));

app.use(bodyParser.json());


//function for db connectivity
const withDB = async (operations,res) => {

    try{
        var mongoose = require('mongoose');
        var dbUri = 'mongodb+srv://my-blog:my-blog@cluster0.swwkm.mongodb.net/my-blog?retryWrites=true&w=majority';
        const client = mongoose.connect(dbUri,{dbName:'my-blog'});
        const db = mongoose.connection;
        await operations(db);

        mongoose.connection.on('connected', function() {
            console.log("App is connected with database.");
         
        })
        mongoose.connection.on('error', function(error) {
            console.log("App is not connected with database. ", error);
        })
        mongoose.connection.on('disconnected', function() {
            console.log("App is disconnected");
        })

    
        client.close();

        }catch(error){
            res.status(500).json({message:'Error connecting to db', error});
        }

}


//REST APIs

app.get('/api/articles/:name', async (req, res) => {

    withDB(async (db) => {

        const articleName = req.params.name;

        const articlesInfo =  await db.collection('articles').findOne({name: articleName});
     
        res.status(200).json(articlesInfo);

    }, res) 

})

app.post('/api/articles/:name/add-comment', async (req, res) => {

        const {username, text} = req.body;
        const articleName = req.params.name;

    withDB(async(db)=> {
        
        const articlesInfo = await db.collection('articles').findOne({name: articleName});
        await db.collection('articles').updateOne({name: articleName},{
            '$set': {
                comments: articlesInfo.comments.concat({username,text}),
            },
        });
        const updatedArticlesInfo = await db.collection('articles').findOne({name: articleName});
        res.status(200).json(updatedArticlesInfo);

    },res); 

})

app.post('/api/articles/:name/upvote', async (req, res) => {

    withDB(async (db) => {
        const articleName = req.params.name;
    
        const articlesInfo = await db.collection('articles').findOne({name: articleName});

        db.collection('articles').updateOne({name: articleName}, {

        '$set': {
            upvotes: articlesInfo.upvotes +1,
        },
    });
    const updatedArticleInfo = await db.collection('articles').findOne({name: articleName});
    res.status(200).json(updatedArticleInfo);

    }, res)

});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
})

app.listen(3000, () => console.log('Listening on port 3000'));