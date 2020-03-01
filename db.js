const { Pool, Client } = require('pg')
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: connectionString,
})

const CONSTANTS = {
    CREATE_LINK : "INSERT INTO links(url, channel, userid) VALUES($1, $2, $3) RETURNING *",
    CREATE_KEYWORD_LINK: "INSERT INTO keyword_link(linkId, keyword) VALUES"

}
module.exports = {
    query : function(){
        pool.query('SELECT NOW()', (err, res) => {
            console.log(err, res)
        })
    },

    addLink : function(url, channel, user, titleKeywords, keywords) {
        pool.query(CONSTANTS.CREATE_LINK, [url, channel, user], (err, res) => {
            if (err) {
                console.log(err.stack)
              } else {
                console.log(res.rows[0])

                console.log(titleKeywords, keywords);

                let kw= Object.keys(keywords), kwlinks=[], linkId = res.rows[0].linkId;
                for(let i=0; i< titleKeywords.length; i++){
                    kwlinks.add([linkId, titleKeywords[i]]);
                }
                for(let i=0; i< kw.length; i++){
                    kwlinks.add([linkId, kw[i]]);
                }

                console.log(kwlinks)
                pool.query(CONSTANTS.CREATE_KEYWORD_LINK + kwlinks + " RETURNING *", (err, res) => {
                    if (err) {
                        console.log(err.stack)
                      } else {
                        console.log(res.rows)
                      }
                });
              }
        })
    }
}



