import Xray from 'x-ray';
import axios from 'axios';

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
        })
    }
}

process()