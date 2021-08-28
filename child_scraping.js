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
        let collection = db.collection("parentdetails9");
        let cursor = collection.find({});
        //console.log(cursor);
        //let docArray = cursor.toArray();
        //let arr = collection.find().snapshot();
        //console.log(arr.length)
        
        await collection.find().forEach(async function(doc) {
            try {
                if (doc.source) {
                    //console.log("city_id: " + doc.id);
                    cityList.push(doc.source);
                    //await activity_request(doc.id);
                }
            } catch (err) {
                console.error(error);
            }
        });
        console.log(cityList.length);
        let faulty = []
        for (let i = 0; i < cityList.length/2; i++) {
            console.log("processing hotel #" + i);
            let hotel_url = cityList[i];
            if (faulty.includes(hotel_url)) {
                console.log('faulty url, skipping')
            } else {
                try {
                    console.log(`processing ${hotel_url}`);
                    await process_child(hotel_url);
                } catch (err) {
                    console.log('faulty url')
                    let collection2 = db.collection("nullchildstuff")
                    
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

//main()
let base_url = 'https://www.hospitalityonline.com/westmont-esd/locations'

process_child(base_url)
async function process_child(baseUrl) {
    MongoClient.connect(DBurl, { useNewUrlParser: true }, async (err, client) => {
        if (err) return console.log(err);
        // Storing a reference to the database so you can use it later
        db = client.db(dbName);
        console.log(`Connected MongoDB: ${DBurl}`);
        console.log(`Database: ${dbName}`);
    })
    let response = await axios.get(baseUrl)
    console.log(response.status)
    if (response.status === 200) {
        const $ = cheerio.load(response.data)
        let end = false
        let counter = 0
        let parent_name = $('.employer-profile-header .employer-vcard h1 a').eq(counter).text().replace(/\n|\r/g, "").trim();
        while (!end) {
            let body = $('.card-body').eq(counter).text().replace(/\n|\r/g, "").trim();
            if (body.length < 10) {
                end = true
            } else {
                let name = $('.card-body .row .col-md-4').eq(counter).text().replace(/\n|\r/g, "").trim();
                //let city = $('.card-body .row .col-md-2').eq(counter).text().replace(/\n|\r/g, "").trim();
                let type = $('.card-body .row .col-md-3').eq(counter).text().replace(/\n|\r/g, "").trim();
                let child_link = $('.card-body .row .col-md-4').eq(counter).find("a[href]").attr('href');
                let full_url = `https://www.hospitalityonline.com${child_link}`
                let response2 = await axios.get(full_url)

                const $$ = cheerio.load(response2.data)
                let phone = $$('.info-well p').eq(1).text().replace(/\n|\r/g, "").trim();
                let city = $$('.info-well .mb-2 span').first().text().replace(/\n|\r/g, "").trim();
                let state = $$('.info-well .mb-2 abbr').text().replace(/\n|\r/g, "").trim();
                const diff = (diffMe, diffBy) => diffMe.split(diffBy).join('')
                let block = $$('.info-well .mb-2 span').text().replace(/\n|\r/g, "").trim();
                let zipcode = diff(block, city)
                let address = $$('.info-well .mb-2').text()
                let address_split = address.split(/\r?\n/)
                //console.log(`split: ${address_split}`)
                let actual_address = address_split[1].trim()

                console.log(child_link)
                const jumpcut = {
                    "name": name,
                    "city": city,
                    "type": type,
                    "parent": parent_name,
                    "parent_source": baseUrl,
                    "phone": phone,
                    "state": state,
                    "zipcode": zipcode,
                    "street_address": actual_address

                }
                //console.log(jumpcut)
                
                let collection2 = db.collection("childdetails9")
                await collection2.insertOne(jumpcut)
                console.log("added hotel" + jumpcut.name)
                /*
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
                */
                
                counter += 1
            }
        }
        //let body = $('.card-body').eq(1675).text().replace(/\n|\r/g, "").trim();
        //let name = $('.info-well h1 a').text().replace(/\n|\r/g, "").trim();
        //let city = $('.info-well .mb-2 span').first().text().replace(/\n|\r/g, "").trim();
        //let state = $('.info-well .mb-2 abbr').text().replace(/\n|\r/g, "").trim()
        //let website = $('.website-url .url').text().replace(/\n|\r/g, "").trim()
        //let num_children = $('.property_locations').text().replace(/\n|\r/g, "").trim()
        //const diff = (diffMe, diffBy) => diffMe.split(diffBy).join('')
        //let block = $('.info-well .mb-2 span').text().replace(/\n|\r/g, "").trim();
        //let zipcode = diff(block, city)
        //console.log(`ZIP: ${zipcode}`)
        //console.log(body.length)
        /*
        let address = $('.info-well .mb-2').each(function(i, item){
            console.log(item);
        })
        

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
        */
    } else {
        console.log('faulty link')
    }
    
}