import pickle
import pandas as pd
import requests
import os
import datetime
import json
import time
import psycopg2
from pprint import pprint
from sklearn.externals import joblib
from busy.settings import STATIC_ROOT
import requests
import datetime
import os

#get weather information
hourSinceLastCall = 0 # type: float
weatherCode = 0 # type: int
futureWeatherCodes = {}
def getWeather(timeStamp: int = None):
    global hourSinceLastCall
    global weatherCode
    global futureWeatherCodes

    #Dublin id for open weather: 7778677
    def fetchRealTimeWeatherCode(timeStamp: int = None):
        global futureWeatherCodes

        if timeStamp is None: #Default to providing current weather
            r = requests.get('http://api.openweathermap.org/data/2.5/weather',
                             params={'q': 'dublin', 'APPID': os.environ.get('APPID')})

            if r.status_code == requests.codes.ok:
                weatherData = r.json()
                weatherCode = weatherData['weather'][0]['id']
                return weatherCode
            else:
                #Could not get weather
                #Use 'typical' Irish weather, i.e. '801, few clouds'
                return 801
        else: #Make a forecast based on provided timestamp
            r = requests.get('http://api.openweathermap.org/data/2.5/forecast',
                             params={'id': '7778677', 'APPID': os.environ.get('APPID')})

            if r.status_code == requests.codes.ok:
                weatherData = r.json()

                futureWeatherCodes = {} #Empty the dictionary
                for row in weatherData['list']:
                    #Update the cache
                    futureWeatherCodes[row['dt']] = row['weather'][0]['id']

                weatherCode = getCachedFutureWeather(timeStamp)
                return weatherCode
            else:
                # Could not get weather
                # Use 'typical' Irish weather, i.e. '801, few clouds'
                return 801

    def getCachedFutureWeather(timeStamp: int = None):
        index = 0
        for key_dt in futureWeatherCodes:
            if index > 0:
                next_dt = key_dt
                if timeStamp < next_dt:
                    futureWeatherCode = futureWeatherCodes[last_dt] #TESTING
                    return futureWeatherCode
                else:
                    last_dt = key_dt
            else:
                last_dt = key_dt

            index += 1

        # Could not get weather
        # Use 'typical' Irish weather, i.e. '801, few clouds'
        futureWeatherCode = 801
        return futureWeatherCode

    #if app just started up...
    if hourSinceLastCall == 0:
        hourSinceLastCall = datetime.datetime.now() + datetime.timedelta(minutes=60)
        weatherCode = fetchRealTimeWeatherCode()
        weatherCodeReturned = weatherCode
        fetchRealTimeWeatherCode(hourSinceLastCall.timestamp())  # Update the forecast cache

    # else query OpenWeather API every hour
    currentCallTime = datetime.datetime.now()
    if currentCallTime > hourSinceLastCall: #If it's been an hour since last API call...
        hourSinceLastCall = currentCallTime + datetime.timedelta(minutes=60)
        #cache the weather code
        weatherCode = fetchRealTimeWeatherCode()
        weatherCodeReturned = weatherCode
    else: #use the cached current weather code
        weatherCodeReturned = weatherCode


    # else query OpenWeather 5 day forecast API if timestamp provided
    if currentCallTime > hourSinceLastCall and timeStamp is not None:
        hourSinceLastCall = currentCallTime + datetime.timedelta(minutes=60)
        futureWeatherCode = fetchRealTimeWeatherCode(timeStamp)
        weatherCodeReturned = futureWeatherCode
    elif timeStamp is not None: # else get cached data
        futureWeatherCode = getCachedFutureWeather(timeStamp)
        weatherCodeReturned = futureWeatherCode

    return weatherCodeReturned



def getDayOfYear():
    year2018inSeconds = 1514764800 #seconds since epoch till January 1st 2018
    currentTimeOfYear = round(time.time()) - year2018inSeconds
    return currentTimeOfYear


def secondsSinceMidnight():
    now = datetime.datetime.now() + datetime.timedelta(minutes=60)  # time of day since epoch + 1h correction for linux server
    time_of_day = (now - now.replace(hour=0, minute=0, second=0, microsecond=0)).total_seconds()
    return time_of_day


def getWeekDayBinaryArray(weekdayNumber: int = None) -> [int, ...]:
    weekDay = [0, 0, 0, 0, 0, 0, 0]  # Binary representation of the 7 days of the week

    if weekdayNumber is None:
        indexOfToday = datetime.datetime.today().weekday()
        weekDay[indexOfToday] = 1
    else:
        weekDay[weekdayNumber] = 1

    return weekDay


results = [{'route_id':-1}] #TESTING BASIC CACHING OF DB RESULTS
def getModelAndProgNum(busNum: str, start_stop: int, end_stop: int, weekdayIndex: int = None, testing: bool = False) -> (object, int, int):
    '''
    Get the model, start_prog_num (in DB), end_prog_num (in DB)
    based on busNum, start_stop, end_stop & direction (in DB)

    Args:
        busNum: The string identifying the bus number: e.g. 46A
        start_stop: The code identifying the start stop e.g. 810
        end_stop: The code identifying the end stop e.g. 2795
        testing:

    Returns:
        object: the loaded pickle file of the model.
        int: start stop program number
        int: end stop program number

    """
    '''

    #declaring globals to modify in this function
    global results

    # To uppercase
    busNum = busNum.upper()
    start_stop = str(start_stop) #Make sure it's a string if not already
    end_stop = str(end_stop) #Make sure it's a string if not already
    #starting values
    startStopProgramNumber = 0
    endStopProgramNumber = 0
    direction = ''

    if weekdayIndex is None: #No weekday supplied, default to current weekday
        weekdayIndex = datetime.datetime.today().weekday()
    serviceIDs = {"y102p": [0, 0, 0, 0, 0, 1, 0],
                  "y102q": [0, 0, 0, 0, 1, 0, 0],
                  "y102f": [1, 1, 1, 1, 1, 0, 0],
                  "y102g": [1, 0, 0, 0, 0, 0, 1],
                  "y102e": [0, 0, 0, 0, 0, 1, 0]}

    relevantServiceIDs = []

    #Compile a list of service_ids that are valid for current day of week in order to filter out the correct rows in DB
    # e.g. if today was Friday (indexOfToday == 4) then the relevantServiceIDs == ['y102q', 'y102f']
    for serviceID in serviceIDs:
        if serviceIDs[serviceID][weekdayIndex] == 1:
            relevantServiceIDs.append(serviceID)


    if not busNum == results[0]['route_id']: # Check the cached query first to skip DB access if not necessary
        # Connect to db
        DATABASE_URL = os.environ.get('DATABASE_URL')  # Get the connection URI string
        conn = psycopg2.connect(DATABASE_URL)

        # Open a (dictionary) cursor to perform db operation
        # For documentation: http://initd.org/psycopg/docs/extras.html
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        # Should return 46a in direction 0 with stops 810 and 2795 as prognum 4 and 23
        queryString = "SELECT * FROM stops WHERE route_id = '{0}';".format(busNum)
        cur.execute(queryString)

        # Obtain data as Python object
        # result = cur.fetchone() #one line only, even if the query returns multiple records.
        results = cur.fetchall()  # multiple results, returns all the records from the query.

        # Clean up
        cur.close()
        conn.close()

    allRouteInfoFound = False
    for index, result in enumerate(results):  # For every row in the returned query
        if allRouteInfoFound:
            break  # Found all the info
        if result['service_id'] not in relevantServiceIDs: #The row is not valid as it does not contain information relevant to today's date
            continue

        startStopProgramNumber = 0
        for index, value in enumerate(result):  # For every column in the row
            if index > 5 and value is not None:
                if value.endswith(start_stop):
                    startStopProgramNumber = index - 5
                    continue
                if startStopProgramNumber > 0 and value.endswith(end_stop):
                    endStopProgramNumber = index - 5
                    # Found all the info
                    allRouteInfoFound = True
                    direction = str(result['direction_id'] + 1)  # DB -> APP,    0+1 -> 1,     1+1 -> 2
                    break

    #Get the pickle and return the values
    file = busNum + '_' + direction + '.pkl' # replace busDirection with direction when not testing
    if testing:
        #Running locally with command => python manage.py runserver localhost:8765
        try:
            modelPickle = joblib.load('static/ml_models_final/' + file)
        except FileNotFoundError:
            return None, None, None
        # If everything OK, return the answers
        return modelPickle, startStopProgramNumber, endStopProgramNumber
    else:
        #Runing on Heroku or locally with command => heroku local web -f Procfile.windows (for windows)
        try:
            modelPickle = joblib.load(STATIC_ROOT+'/ml_models_final/' + file)
        except FileNotFoundError:
            return None, None, None
        # If everything OK, return the answers
        return modelPickle, startStopProgramNumber, endStopProgramNumber


def predictor_ann_improved(ann_improved, start_stop, end_stop, time_of_day, weatherCode, secondary_school, primary_school, trinity, ucd, bank_holiday, event, day_of_year, weekday, delay, testing=False):

    #Abort if model could not be found
    if ann_improved is None:
        return -1

    start ={'prognum': start_stop,
            'time': time_of_day,
            'day_unix': day_of_year,
            'weather_id': weatherCode,
            'Mon': weekday[0],
            'Tue': weekday[1],
            'Wed': weekday[2],
            'Thu': weekday[3],
            'Fri': weekday[4],
            'Sat': weekday[5],
            'Sun': weekday[6],
            'start_stop': 1, #ALWAYS 1
            'secondary':secondary_school,
            'primary':primary_school,
            'trinity':trinity,
            'ucd':ucd,
            'bank_hol': bank_holiday,
            'event':event,
            'delay': delay}

    end = {'prognum': end_stop,
             'time': time_of_day,
             'day_unix': day_of_year,
             'weather_id': weatherCode,
             'Mon': weekday[0],
             'Tue': weekday[1],
             'Wed': weekday[2],
             'Thu': weekday[3],
             'Fri': weekday[4],
             'Sat': weekday[5],
             'Sun': weekday[6],
             'start_stop': 1,  # ALWAYS 1
             'secondary': secondary_school,
             'primary': primary_school,
             'trinity': trinity,
             'ucd': ucd,
             'bank_hol': bank_holiday,
             'event': event,
             'delay': delay}

    index = [0]
    start_df = pd.DataFrame(data=start, index=index)
    end_df = pd.DataFrame(data=end, index=index)

    startPrediction = ann_improved.predict(start_df)
    endPredicion = ann_improved.predict(end_df)

    # Estimated time
    time_est = endPredicion - startPrediction

    return time_est[0]
