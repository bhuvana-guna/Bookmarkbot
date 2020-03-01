var express = require('express');
var timeout = require('connect-timeout')
var app = express();
var bodyParser = require('body-parser');
var cheerio = require('cheerio');
var request = require('request');
const db = require("./db")
const dotenv = require('dotenv');
dotenv.config();

const constants = {
    SLASH_TOKEN: process.env.SLASH_TOKEN,
    BOOKMARK: "/bookmark"
}

app.use(timeout('30s'))
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/', function(req, res) {
    //console.log(req.body)

    if(req.body.token == constants.SLASH_TOKEN){
        let channelId = req.body.channel_id;
        let query = req.body;
        let reply = {
            "response_type": "in_channel",
            "text" : "Thank you!"
        }
        if(req.body.command == constants.BOOKMARK){
            reply.token = query.token;
            reply.team_id = query.team_id;
            reply.channel_id = query.channel_id;
            reply.channel_name = query.channel_name;
            reply.timestamp = new Date(query.timestamp);
            //reply.user_id = query.user_id;
            //reply.user_name = "bookbot";
            console.log("calling webpage : " + query.text);
            request(query.text, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    const $ = cheerio.load(body);
                    const webpageTitle = $("title").text();
                    const metaDescription =  $('meta[name=description]').attr("content");
                    const webpage = {
                        title: webpageTitle,
                        metaDescription: metaDescription
                    }
                    console.log(webpage);

                    let titleKeywords = webpage.split(" ");

                    var url = 'https://api.twinword.com/api/v5/topic/generate/';
                    var headers = { 
                        'X-Twaip-Key': process.env.TWINWORD_API_KEY,
                        'Content-Type' : 'application/x-www-form-urlencoded' 
                    };
                    var form = { text: metaDescription};

                    request.post({ url: url, form: form, headers: headers }, function (e, r, body) {
                        // your callback body
                        //console.log(e);
                        console.log(body)
                        console.log("calling db")
                        console.log(query.text, query.channel_id, query.user_id);
                        db.addLink(query.text, query.channel_id, query.user_id,titleKeywords, body.keyword);

                        reply.text = "Your link " + query.text + " has been bookmarked "+ query.user_name;
                        res.json(reply);
                    });
  
                }
              });
        } else {
            res.json(reply);
        }
    }
});

app.listen(process.env.PORT || 8080);
console.log("Server Started");