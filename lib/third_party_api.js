const axios = require('axios');
const URL = 'http://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1';

module.exports = async function get_films_from_third_party (films) {
  let response;
  try {
    response = await axios.get(`${URL}`,{
      params: {
        films: films
      }
    });
  } catch (err) {    
    console.log(err);
  };
  
  return response.data;
};
