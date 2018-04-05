const moment = require('moment');

module.exports = async function get_films_from_db(db, film_id, callback) {
  let list_of_ids_from_db = [];
  let films_from_db = [];

  const QUERY = 
  `SELECT * FROM films where genre_id IN (
    SELECT genre_id as genre FROM films WHERE id = ${film_id}
  );`;

  db.all(QUERY, function(err,rows){      
    const film_release_date = moment(rows.find(x => x.id === parseInt(film_id)).release_date);  
    rows.map((row) => {    
      if ( 
        film_release_date.diff(row.release_date, 'year') < 15 && 
        film_release_date.diff(row.release_date, 'year') > -15
      ) {
        films_from_db.push(row);
        list_of_ids_from_db.push(row.id);
      };         
    });    
    callback(list_of_ids_from_db, films_from_db, err);
  })
};