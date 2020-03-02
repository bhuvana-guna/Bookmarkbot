const { Pool, Client } = require('pg')
const { v1: uuidv1 } = require('uuid');
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: connectionString,
})

const CONSTANTS = {
    CREATE_LINK : "INSERT INTO links(id, url, title, channel, userid) VALUES($1, $2, $3, $4, $5) RETURNING *",
    CREATE_KEYWORD_LINK: "INSERT INTO keyword_link(linkId, keyword) VALUES",
    SEARCH_LINK: "select l.url, l.title from keyword_link kl join links l on kl.linkid = l.id and kl.keyword in "

}
module.exports = {
    query : function(){
        pool.query('SELECT NOW()', (err, res) => {
            console.log(err, res)
        })
    },

    addLink : function(url, title, channel, user, keywords) {
        pool.query(CONSTANTS.CREATE_LINK, [uuidv1(), url, title, channel, user], (err, res) => {
            if (err) {
                console.log(err.stack)
              } else {
                console.log(res.rows[0])

                console.log(keywords);

                let kwlinks="", linkId = res.rows[0].id;
                for(let i=0; i< keywords.length; i++){
                    kwlinks = kwlinks + "('"+ linkId +"','"+ keywords[i] + "'),";
                }

                kwlinks = kwlinks.slice(0, -1);
                console.log(kwlinks)
                console.log(CONSTANTS.CREATE_KEYWORD_LINK + kwlinks + " RETURNING *")
                pool.query(CONSTANTS.CREATE_KEYWORD_LINK + kwlinks + " RETURNING *", (err, res) => {
                    if (err) {
                        console.log(err.stack)
                      } else {
                        console.log(res.rows)
                      }
                });
              }
        })
    },

    searchLink : function(text, keywords, res, reply){

        let kwstr = "('";
        for(let i=0; i< keywords.length; i++){
            kwstr = kwstr + keywords[i].trim() + "','";
        }

        kwstr = kwstr.slice(0, -1);
        kwstr = kwstr.slice(0, -1);

        pool.query(CONSTANTS.SEARCH_LINK + kwstr + ")", (err, response) => {
            if (err) {
                console.log(err.stack)
                res.json(reply);
            } else {
                console.log(response.rows);
                let links = "", map= {};
                response.rows.forEach(e => {
                    if(!map[e.url]){
                        links = links + e.title + " - " + e.url + " \n";
                        map[e.url] = true;
                    }    
                });
                reply.text = "Here are the links with " + text + " - \n" + links;
                res.json(reply);
            }
        });
    }
}



