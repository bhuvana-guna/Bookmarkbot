const { Pool, Client } = require('pg')
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: connectionString,
})

module.exports = {
    query : function(){
        pool.query('SELECT NOW()', (err, res) => {
            console.log(err, res)
            pool.end()
          })
    } 
}



