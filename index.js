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
      get_films_from_db = require('./db/queries');

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
  let films_from_api;
  let final_list;
  let final_list_with_genre;
  let film_genre_name = 'test';
  
  //retrieve films from db
  get_films_from_db(db, parseInt(film_id), function(ids, films, genre, err) {
    films_from_db = films;
    film_genre_name = genre[0].name;    

    // get data from api
    get_films_from_third_party(ids.toString())
    .then((films_from_api) => {      
      return filter_films_list(films_from_api, films_from_db);
    }).then((final_list) => {        
      final_list.forEach((film) => {
        film.genre = film_genre_name;
      });  
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
    // .catch((err) => {
    //   res.send('error')
    // });
  })
  
  
}

module.exports = app;
