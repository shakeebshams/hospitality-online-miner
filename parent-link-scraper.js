import Xray from 'x-ray';
import axios from 'axios';
import pkg from 'mongodb';
const { MongoClient } = pkg;
const DBurl = 'mongodb://127.0.0.1:27017'


const dbName = 'hourls'
let db

MongoClient.connect(DBurl, { useNewUrlParser: true }, (err, client) => {
  if (err) return console.log(err);
  // Storing a reference to the database so you can use it later
  db = client.db(dbName);
  console.log(`Connected MongoDB: ${DBurl}`);
  console.log(`Database: ${dbName}`);
});

let xray = Xray();
let page = 1
let baseUrl = `https://www.hospitalityonline.com/employers?page=${page}`
let max = 3160
async function process() {
    for (let i = page; i < max + 1; i++) {
        let url = `https://www.hospitalityonline.com/employers?page=${i}`
        await xray(url, ['.managed_by a@href'])(async function(err, title) {
            console.log(`page: ${i}`)
            console.log(`found ${title}`)
            for (let link of title) {
                try {
                    let url_json = {url: link};
                    let collection = db.collection("hourls3");
                    await collection.findOne({url: link}, async function(err, doc) {
                        if (!doc) {
                            await collection.insertOne(url_json, function(err, res) {
                                if (err) {
                                    console.log(err);
                                };
                            });
                        } else {
                            console.log("already exists: " + link)
                        }
                    }); 
                } catch (err) {
                    console.error(err);
                }
            }
        })
        
    }
}

process()