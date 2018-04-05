const sqlite = require('sqlite'),
      Sequelize = require('sequelize'),
      request = require('request'),
      express = require('express'),
      app = express(),
      sqlite3 = require('sqlite3').verbose(),
      db = new sqlite3.Database('./db/database.db'),
      axios = require('axios'),
      get_films_from_third_party = require('./lib/third_party_api'),
      filter_films_list = require('./lib/filter_films_list'),
      filter_films_meta = require('./lib/filter_films_meta'),
      moment = require('moment'),
      get_films_from_db = require('./db/queries')
      get_genre = require('./db/get_genre');

const sequelize = new Sequelize('sqlite:/home/abs/path/dbname.db')

const { PORT=3000, NODE_ENV='development', DB_PATH='./db/database.db' } = process.env;

// START SERVER
Promise.resolve()
  .then(() => app.listen(PORT, () => console.log(`App listening on port ${PORT}`)))
  .then(() => {
    app.get('/films/:id/recommendations', getFilmRecommendations);
  })
  .catch((err) => { if (NODE_ENV === 'development') console.error(err.stack); });


// ROUTE HANDLER
function getFilmRecommendations(req, res) {
  const film_id = req.params.id;
  let films_from_db = [];
  let films_from_api;
  let final_list;
  let film_genre_name;
  
  //retrieve films from db
  get_films_from_db(db, parseInt(film_id), function(ids, films, err) {
    films_from_db = films;

    // get data from api
    get_films_from_third_party(ids.toString())
    .then((films_from_api) => {      
      final_list = filter_films_list(films_from_api, films_from_db);      

      const meta_query = {
        limit: req.query.limit || 10,
        offset: req.query.offset || 0
      }
        
      meta_filtered_list = filter_films_meta(final_list, meta_query);

      json_object = {
        recommendations: meta_filtered_list,
        meta: meta_query
      };
      res.setHeader('Content-Type', 'application/json');    
      res.send(JSON.stringify(json_object));      
    })    
    .catch((err) => {
      res.send('error')
    });
  })
  
  
}

module.exports = app;
