const sqlite = require('sqlite'),
  Sequelize = require('sequelize'),
  request = require('request'),
  express = require('express'),
  app = express(),
  sqlite3 = require('sqlite3').verbose(),
  db = new sqlite3.Database('./db/database.db'),
  axios = require('axios'),
  moment = require('moment');

const sequelize = new Sequelize('sqlite:/home/abs/path/dbname.db');
const URL = 'http://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1';

const { PORT = 3000, NODE_ENV = 'development', DB_PATH = './db/database.db' } = process.env;

// START SERVER
Promise.resolve()
  .then(() => app.listen(PORT, () => console.log(`App listening on port ${PORT}`)))
  .then(() => {
    app.get('/films/:id/recommendations', validateRoute, getFilmRecommendations);
    app.get('/*', function(req, res) {
      res.status(404).send({ message: 'key missing' });
    });
  })
  .catch(err => {
    if (NODE_ENV === 'development') console.error(err.stack);
  });

// ROUTE HANDLER
function getFilmRecommendations(req, res) {
  const filmdID = req.params.id;
  let filmsArray = [];
  const metaQuery = {
    limit: req.query.limit || 10,
    offset: req.query.offset || 0
  };

  getInfoFromDB(db, filmdID)
    .then(infoFromDB => {
      filmsArray = infoFromDB.films;
      return getFilmsFromAPI(infoFromDB.ids.toString());
    })
    .then(infoFromAPI => {
      const ratingsFilteredList = filterFilmsRatings(infoFromAPI, filmsArray);
      const metaFilteredList = filterFilmsMeta(ratingsFilteredList, metaQuery);
      json_object = {
        recommendations: metaFilteredList,
        meta: metaQuery
      };
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(json_object));
    })
    .catch(error => {
      reject(error);
    });
}

// DB Queries
// getFilmsFromDb, then getGenreFromDB
const getInfoFromDB = (db, film_id) => {
  let filmsArray = [];
  let idsArray = [];

  return new Promise((resolve, reject) => {
    getFilmsFromDB(db, film_id)
      .then(({ films, ids }) => {
        filmsArray = films;
        idsArray = ids;
        return getGenreFromDB(db, films[0]['genre_id']);
      })
      .then(genre => {
        filmsArray.map(film => {
          delete film.genre_id;
          film.genre = genre[0].name;
        });
        resolve({ films: filmsArray, ids: idsArray });
      })
      .catch(error => {
        reject(error);
      });
  });
};

const getFilmsFromDB = (db, film_id) => {
  return new Promise((resolve, reject) => {
    let filmsArray = [];
    let idsArray = [];

    const QUERY = `SELECT * FROM films WHERE genre_id IN (
        SELECT genre_id FROM films WHERE id = ${film_id}
      );`;

    db.all(QUERY, function(err, rows) {
      if (err) {
        // TO-DO cannot debug to catch err, must trace
        // causes app to crash
        console.log(err);
        reject(err);
      }
      const queryReleaseDate = moment(rows.find(x => x.id === parseInt(film_id)).release_date);
      rows.map(row => {
        if (
          queryReleaseDate.diff(row.release_date, 'year') <= 15 &&
          queryReleaseDate.diff(row.release_date, 'year') >= -15
        ) {
          idsArray.push(row.id);
          filmsArray.push(row);
        }
      });
      resolve({ films: filmsArray, ids: idsArray });
    });
  });
};

const getGenreFromDB = (db, genre_id) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT name FROM genres WHERE id=${genre_id};`, function(err, data) {
      if (err) reject(err);
      resolve(data);
    });
  });
};

// get film info from the 3rd party API
const getFilmsFromAPI = async films => {
  let response;
  try {
    response = await axios.get(`${URL}`, { params: { films: films } });
  } catch (err) {
    throw new Error(422);
  }
  return response.data;
};

// check if films have atleast 4 ratings and average for ratings is above 4
// return objects with info
const filterFilmsRatings = (filmsFromAPI, filmsFromDB) => {
  let filmsWithMinRatings = [];
  let filmsWithGoodRatings = [];

  filmsFromAPI.map((film, index) => {
    if (film.reviews.length >= 5) {
      filmsWithMinRatings.push(film);
    }
  });

  filmsWithMinRatings.forEach((film, index) => {
    const sum = film.reviews.reduce(function(acc, review) {
      return acc + review.rating;
    }, 0);
    const average = sum / film.reviews.length;
    const ratings_count = film.reviews.length;
    if (average >= 4) {
      filmsFromDB.filter(x => x.id === film.film_id).map(film => {
        let film_date = moment(film.release_date).format('YYYY-MM-DD');
        let object = {
          id: film.id,
          title: film.title,
          releaseDate: film_date,
          genre: film.genre,
          averageRating: average.toFixed(2) / 1,
          reviews: ratings_count
        };
        filmsWithGoodRatings.push(object);
      });
    }
  });

  return filmsWithGoodRatings;
};

// check for limit and offset , defaults are 10 and 0
const filterFilmsMeta = (films, query) => {
  if (query.limit != 10 && query.offset == 0) {
    return films.splice(0, query.limit);
  } else if (query.limit == 10 && query.offset != 0) {
    return films.splice(query.offset, films.length);
  } else if (query.limit != 10 && query.offset != 0) {
    return films.splice(query.offset, query.limit);
  } else {
    return films;
  }
};

// route validation, check for id, limit, and offset
const validateRoute = (req, res, next) => {
  const msg = { message: 'key missing' };
  if (isNaN(parseInt(req.params.id))) {
    res.status(422).send(msg);
  } else if (req.query.limit && isNaN(parseInt(req.query.limit))) {
    res.status(422).send(msg);
  } else if (req.query.offset && isNaN(parseInt(req.query.offset))) {
    res.status(422).send(msg);
  }
  next();
};

module.exports = app;
