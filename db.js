const { Pool, Client } = require('pg')
const { v1: uuidv1 } = require('uuid');
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: connectionString,
})

const CONSTANTS = {
    CREATE_LINK : "INSERT INTO links(id, url, channel, userid) VALUES($1, $2, $3, $4) RETURNING *",
    CREATE_KEYWORD_LINK: "INSERT INTO keyword_link(linkId, keyword) VALUES"

}
module.exports = {
    query : function(){
        pool.query('SELECT NOW()', (err, res) => {
            console.log(err, res)
        })
    },

    addLink : function(url, channel, user, titleKeywords, keywords) {
        pool.query(CONSTANTS.CREATE_LINK, [uuidv1(), url, channel, user], (err, res) => {
            if (err) {
                console.log(err.stack)
              } else {
                console.log(res.rows[0])

                console.log(titleKeywords, keywords);

                let kw= Object.keys(keywords), kwlinks="", linkId = res.rows[0].id;
                for(let i=0; i< titleKeywords.length; i++){
                    kwlinks = kwlinks + "('"+ linkId +"','"+ titleKeywords[i] + "')";
                }
                for(let i=0; i< kw.length; i++){
                    kwlinks = kwlinks + "('"+ linkId +"','"+ kw[i] + "')";
                }

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
    }
}



