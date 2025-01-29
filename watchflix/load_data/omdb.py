import requests
import logging
import time
from django.conf import settings

OMDB_API_URL = 'http://www.omdbapi.com/'
OMDB_API_KEY = 'a475ded9'

logger = logging.getLogger(__name__)

def fetch_movie_details(imdb_id, api_key=OMDB_API_KEY, delay=1):
    params = {'i': imdb_id, 'apikey': api_key}

    logger.debug(f"Using OMDb API key: {api_key} and {imdb_id}")
    try:
        response = requests.get(OMDB_API_URL, params=params)
        data = response.json()

        if response.status_code != 200:
            logger.error(f"OMDb API returned status code {response.status_code} for IMDb ID {imdb_id}")
            return None
        
        time.sleep(delay)

        if data.get('Response') == 'False':
            logger.warning(f"OMDb API error for IMDb ID {imdb_id}: {data.get('Error')}")
            return None

        return {
            'title': data.get('Title', ''),
            'year': int(data.get('Year', 0)),
            'genres': data.get('Genre', ''),
            'duration': int(data.get('Runtime', '0').split(' ')[0]) if data.get('Runtime', '0').split(' ')[0].isdigit() else 0,
            'poster_url': data.get('Poster', ''),
            'director': data.get('Director'),
            'actors': data.get('Actors'),
            'plot': data.get('Plot', ''),
            'language': data.get('Language', ''),
            'imdb_rating': float(data.get('imdbRating')),
            'imdb_votes': int(data.get('imdbVotes'))
        }

    except requests.exceptions.RequestException as e:
        logger.error(f"Request error when fetching data from OMDb for IMDb ID {imdb_id}: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error fetching data from OMDb for IMDb ID {imdb_id}: {e}")
        return None
