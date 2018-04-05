module.exports = filter_films_meta = (films, query) => {
 if (query.limit != 10 && query.offset == 0) {
    return films.splice(0, query.limit);
 } else if (query.limit == 10 && query.offset != 0) {
    return films.splice(query.offset, films.length);
 } else if (query.limit != 10 && query.offset != 0 ){
    return films.splice(query.offset, query.limit);
 } else {
  return films;
 }
};