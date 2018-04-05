const moment = require('moment');

module.exports = filter_films_list = (films, films_from_db) => {
  let filtered_list_of_films = [];
  let films_with_ratings = [];
  let final_list = [];
  let final_list_with_details = [];

  films.map((film,index) => {    
    if (film.reviews.length >= 5) {          
      films_with_ratings.push(film);
    };
  })

  films_with_ratings.forEach((film, index, object) => {                  
    const sum = film.reviews.reduce(function (acc, review) { return acc + review.rating; }, 0);
    const average = sum/film.reviews.length;    
    const ratings_count = film.reviews.length;
    if (average >= 4 ){  
      
      films_from_db.filter(x => x.id === film.film_id).map(film => {
        let film_date = moment(film.release_date).format('YYYY-MM-DD');
        let object = {
          id : film.id,
          title : film.title,
          releaseDate : film_date,
          genre: film.genre_id,
          averageRating: (average.toFixed(2))/1,
          reviews: ratings_count
        }
        final_list_with_details.push(object);
      });              
    }
  });

  return final_list_with_details;
}