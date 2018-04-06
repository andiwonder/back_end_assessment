const moment = require('moment');


module.exports = function get_films_info_from_db(db, film_id) {
  let films_from_db = [];
  let ids_from_db = [];

  return new Promise((resolve,reject) => {
    retrieve_films_from_db(db, film_id)
    .then(({films, ids}) => {    
      films_from_db = films;
      ids_from_db = ids;      
      return retrieve_genre_from_db(db, films[0]['genre_id']);
    })
    .then((genre) => {    
      films_from_db.map((film) => {
        delete film.genre_id;
        film.genre = genre[0].name;
      })        
      resolve({films: films_from_db, ids: ids_from_db});      
    })
    .catch((error) => {
      reject(error);
    });    
  })
};



let retrieve_films_from_db = (db, film_id) => { 
  return new Promise((resolve,reject) => {        
    let films_from_db = [];
    let ids_from_db = [];

    const QUERY = 
      `SELECT * FROM films where genre_id IN (
        SELECT genre_id as genre FROM films WHERE id = ${film_id}
      );`;

    db.all(QUERY, function(err,rows){    
      if (err) { reject(err)};     
      const film_release_date = moment(rows.find(x => x.id === parseInt(film_id)).release_date);  
      rows.map((row) => {    
        if ( 
          film_release_date.diff(row.release_date, 'year') <= 15 && 
          film_release_date.diff(row.release_date, 'year') >= -15
        ) {
          ids_from_db.push(row.id);
          films_from_db.push(row);                    
        };         
      });
      resolve({films: films_from_db, ids: ids_from_db});      
    });
  });
};



let retrieve_genre_from_db = (db, genre_id) => {
  return new Promise((resolve,reject) => {    
    db.all(`SELECT name FROM genres where id=${genre_id};`, function(err,data) {      
      if (err) { reject(err)};
      resolve(data);

    })
  })
}
  
