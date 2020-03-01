const { Pool, Client } = require('pg')
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: connectionString,
})

const CONSTANTS = {
    CREATE_LINK : "INSERT INTO links(url, channel, userId) VALUES($1, $2) RETURNING *"
}
module.exports = {
    query : function(){
        pool.query('SELECT NOW()', (err, res) => {
            console.log(err, res)
        })
    },

    addLink : function(url, channel, user) {
        pool.query(CONSTANTS.CREATE_LINK, [url, channel, user], (err, res) => {
            if (err) {
                console.log(err.stack)
              } else {
                console.log(res.rows[0])
              }
        })
    }
}



