var express = require('express');
var timeout = require('connect-timeout')
var app = express();
var bodyParser = require('body-parser');
var cheerio = require('cheerio');
var request = require('request');
const db = require("./db");
const util = require("./util");
const dotenv = require('dotenv');
dotenv.config();

const constants = {
    BOOKMARK_SLASH_TOKEN: process.env.BOOKMARK_SLASH_TOKEN,
    SEARCH_SLASH_TOKEN: process.env.SEARCH_SLASH_TOKEN,
    BOOKMARK: "/bookmark",
    SEARCH: "/searchlink"
}

app.use(timeout('30s'))
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/', function(req, res) {
    console.log(req.body)

    if(req.body.token == constants.BOOKMARK_SLASH_TOKEN || req.body.token == constants.SEARCH_SLASH_TOKEN){
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

                    let titleKeywords = webpageTitle.replace(/[^a-zA-Z0-9 ]/g, " ").split(" ");
                    titleKeywords = titleKeywords.filter(e => e.trim().length > 0);
                    titleKeywords = titleKeywords.map(e => e.toLowerCase())
                    titleKeywords = util.removeStopWords(titleKeywords);

                    if(!metaDescription) {
                        console.log("calling db without meta")
                        console.log(query.text,webpageTitle, query.channel_id, query.user_id);
                        db.addLink(query.text, webpageTitle, query.channel_id, query.user_id,titleKeywords);

                        reply.text = "Your link " + query.text + " has been bookmarked "+ query.user_name+". \n\nYou can search using these keywords - "+ titleKeywords.reduce((str, e) => str+" #"+e + " ", str="");
                        res.json(reply);
                    } else {
                        var url = 'https://api.twinword.com/api/v5/topic/generate/';
                        var headers = { 
                            'X-Twaip-Key': process.env.TWINWORD_API_KEY,
                            'Content-Type' : 'application/x-www-form-urlencoded' 
                        };
                        var form = { text: metaDescription};
    
                        request.post({ url: url, form: form, headers: headers }, function (e, r, body) {
                            console.log(body)
                            body = JSON.parse(body)
                            console.log( body.keyword)
                            let keywords =  Object.keys(body.keyword);
                            keywords = keywords.filter( el => !titleKeywords.includes( el ) );
                            keywords = keywords.concat(titleKeywords);
                            console.log("calling db");
                            console.log(query.text, webpageTitle, query.channel_id, query.user_id);
                            db.addLink(query.text, webpageTitle, query.channel_id, query.user_id,keywords);
                            
                            reply.text = "Your link " + query.text + " has been bookmarked "+ query.user_name+". \n\nYou can search using these keywords - "+ keywords.reduce((str, e) => str+" #"+e + " ", str="");
                            res.json(reply);
                        });
                    }

                    
  
                }
              });
        } else if(req.body.command == constants.SEARCH) {
            reply.token = query.token;
            reply.team_id = query.team_id;
            reply.channel_id = query.channel_id;
            reply.channel_name = query.channel_name;
            reply.timestamp = new Date(query.timestamp);
            let keywords = query.text.replace(" ", ",").split(",");

            db.searchLink(query.text, keywords, res, reply);

        } else {
            res.json(reply);
        }
    }
});

app.listen(process.env.PORT || 8080);
console.log("Server Started");