import Xray from 'x-ray';
import axios from 'axios';
import pkg from 'mongodb';
const { MongoClient } = pkg;
const DBurl = 'mongodb://127.0.0.1:27017'


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
        let faulty = ['https://www.hospitalityonline.com/soho-house-co-americas']
        for (let i = 0; i < cityList.length; i++) {
            console.log("processing hotel #" + i);
            let hotel_url = cityList[i];
            if (faulty.includes(hotel_url)) {
                console.log('faulty url, skipping')
            } else {
                await process_parent(hotel_url);
            }
        }
        return 1
        
    });

}

main()
let baseUrl = 'https://www.hospitalityonline.com/soho-house-co-americas'


async function process_parent(baseUrl) {

    // Name
    let name = await xray(baseUrl, 'h1 a')
    if (!name) {
        name = 'N/A'
    }

    //City
    let city = await xray(baseUrl, 'p.mb-2 span')
    if (!city) {
        city = 'N/A'
    }

    //State
    let state = await xray(baseUrl, 'p.mb-2 abbr@title')
    if (!state) {
        state = 'N/A'
    }

    //Link
    let link = await xray(baseUrl, '.property_locations@href')
    if (!link) {
        link = 'N/A'
    }

    //Children
    let children_link = await xray(baseUrl, '.url@href')
    if (!link) {
        link = 'N/A'
    }

    //Number of Children
    let num_children
    num_children = await xray(baseUrl, '.property_locations')
    if (num_children) {
        num_children = num_children.split(' ')[1]
    } else {
        num_children = 'N/A'
    }

    const jumpcut = {
        "name": name,
        "city": city,
        "state": state,
        "website": link,
        "num_of_children": num_children,
        "children_properties": children_link,
    }
    
    let collection2 = db.collection("parentdetails4")
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
            console.log("already exists: " + link)
        }
    })
    
}