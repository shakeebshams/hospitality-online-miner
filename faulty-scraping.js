import Xray from 'x-ray';
import axios from 'axios';
import pkg from 'mongodb';
const { MongoClient } = pkg;
const DBurl = 'mongodb://127.0.0.1:27017'
//using cheerio
import cheerio from 'cheerio'
import util from 'util'

const dbName = 'hourls'
let db
let xray = Xray();

async function main() {
    //using for loop intead of for each as it would be processed async by default
    let cityList = [];
    MongoClient.connect(DBurl, { useNewUrlParser: true }, async (err, client) => {
        if (err) return console.log(err);
        // Storing a reference to the database so you can use it later
        db = client.db(dbName);
        console.log(`Connected MongoDB: ${DBurl}`);
        console.log(`Database: ${dbName}`);
        let collection = db.collection("hourls3");
        let cursor = collection.find({});
        //console.log(cursor);
        //let docArray = cursor.toArray();
        //let arr = collection.find().snapshot();
        //console.log(arr.length)
        
        await collection.find().forEach(async function(doc) {
            try {
                if (doc.url) {
                    //console.log("city_id: " + doc.id);
                    cityList.push(doc.url);
                    //await activity_request(doc.id);
                }
            } catch (err) {
                console.error(error);
            }
        });
        console.log(cityList.length);
        let faulty = []
        for (let i = 0; i < cityList.length; i++) {
            console.log("processing hotel #" + i);
            let hotel_url = cityList[i];
            if (faulty.includes(hotel_url)) {
                console.log('faulty url, skipping')
            } else {
                try {
                    await process_parent(hotel_url);
                } catch (err) {
                    console.log('faulty url')
                    let collection2 = db.collection("nullstuff")
                    
                    collection2.insertOne({url: hotel_url}, function(err, res) {
                        if (err) {
                            console.log(err)
                        } else {
                            console.log("ADDED to faulty")
                        }
                    })
                }
            }
        }
        return 1
        
    });

}

main()
//let baseUrl = 'https://www.hospitalityonline.com/soho-house-co-americas'

//process_parent(baseUrl)
async function process_parent(baseUrl) {
    let response = await axios.get(baseUrl)
    console.log(response.status)
    if (response.status === 200) {
        const $ = cheerio.load(response.data)
        let phone = $('.info-well p').eq(1).text().replace(/\n|\r/g, "").trim();
        let name = $('.info-well h1 a').text().replace(/\n|\r/g, "").trim();
        let city = $('.info-well .mb-2 span').first().text().replace(/\n|\r/g, "").trim();
        let state = $('.info-well .mb-2 abbr').text().replace(/\n|\r/g, "").trim()
        let website = $('.website-url .url').text().replace(/\n|\r/g, "").trim()
        let num_children = $('.property_locations').text().replace(/\n|\r/g, "").trim()
        const diff = (diffMe, diffBy) => diffMe.split(diffBy).join('')
        let block = $('.info-well .mb-2 span').text().replace(/\n|\r/g, "").trim();
        let zipcode = diff(block, city)
        //console.log(`ZIP: ${zipcode}`)
        /*
        let address = $('.info-well .mb-2').each(function(i, item){
            console.log(item);
        })
        */
        let address = $('.info-well .mb-2').text()
        let address_split = address.split(/\r?\n/)
        //console.log(`split: ${address_split}`)
        let actual_address = address_split[1].trim()
        let full_address = `${actual_address}, ${city}, ${state}, ${zipcode}`
        //console.log(full_address)
        if (num_children) {
            num_children = num_children.split(' ')[1]
        } else {
            num_children = 'N/A'
        }
        let source = baseUrl + '/locations'
        const jumpcut = {
            "name": name,
            "street_address": actual_address,
            "city": city,
            "state": state,
            "zipcode": zipcode,
            "phone": phone,
            "source": source,
            "num_of_children": num_children,
            "website": website,
        }
        console.log(jumpcut)
        
        let collection2 = db.collection("parentdetails10")
        await collection2.findOne({name: jumpcut.name}, async function(err, doc) {
            if (!doc) {
                await collection2.insertOne(jumpcut, function(err, res) {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log("ADDED " + jumpcut.name)
                    }
                })
            } else {
                console.log("already exists: " + jumpcut.name)
            }
        })
        
    } else {
        console.log('faulty link')
    }
    
}