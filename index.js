const sqlite = require('sqlite'),
      Sequelize = require('sequelize'),
      request = require('request'),
      express = require('express'),
      app = express(),
      sqlite3 = require('sqlite3').verbose(),
      db = new sqlite3.Database('./db/database.db'),
      axios = require('axios'),
      moment = require('moment'),

      get_films_from_db = require('./db/queries'),

      get_films_from_third_party = require('./lib/third_party_api'),
      filter_films_ratings = require('./lib/filter_films_list'),
      filter_films_meta = require('./lib/filter_films_meta');
      

const sequelize = new Sequelize('sqlite:/home/abs/path/dbname.db')

const { PORT=3000, NODE_ENV='development', DB_PATH='./db/database.db' } = process.env;

// START SERVER
Promise.resolve()
  .then(() => app.listen(PORT, () => console.log(`App listening on port ${PORT}`)))
  .then(() => {
    app.get('/films/:id/recommendations', getFilmRecommendations);
    app.get('*', function(req, res){
      res.status(404).send('key missing');
    });
  })
  .catch((err) => { if (NODE_ENV === 'development') console.error(err.stack); });


// ROUTE HANDLER
function getFilmRecommendations(req, res) {
  const film_id = req.params.id;
  let films_from_db = [];
  const meta_query = {
    limit: req.query.limit || 10,
    offset: req.query.offset || 0
  };

  get_films_from_db(db,film_id).then((data) => {
    films_from_db = data.films;  
    return get_films_from_third_party(data.ids.toString());
  })
  .then((data) => {  
    
    let final_list = filter_films_ratings(data, films_from_db);
    let meta_filtered_list = filter_films_meta(final_list, meta_query);
    
    json_object = {
      recommendations: meta_filtered_list,
      meta: meta_query
    };
    res.setHeader('Content-Type', 'application/json');    
    res.send(JSON.stringify(json_object));     
  })  
}

module.exports = app;
