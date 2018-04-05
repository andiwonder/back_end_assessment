module.exports = function get_genre(db, genre_id) {
  const QUERY = `SELECT * FROM genre where id = ${genre_id}`;
  db.all(QUERY, function(err,rows){      
    console.log(rows);
    return rows[0].name;
  })
};