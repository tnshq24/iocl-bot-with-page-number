import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    ENDPOINT = os.environ["ENDPOINT"]
    DEPLOYMENT = os.environ["DEPLOYMENT"]
    SUBSCRIPTION_KEY = os.environ["SUBSCRIPTION_KEY"]
    SEARCH_ENDPOINT = os.environ["SEARCH_ENDPOINT"]
    SEARCH_KEY = os.environ["SEARCH_KEY"]
    SEARCH_INDEX = os.environ["SEARCH_INDEX"]