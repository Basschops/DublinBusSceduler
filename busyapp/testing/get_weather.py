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
                    #print(row['dt'],':',row['weather'][0]['id']) #FOR TESTING
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
            print(key_dt, futureWeatherCodes[key_dt])
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

#print("\nFirst request: ", getWeather(1533114780)) # Tuesday, 1 August 2018 09:13:00 GMT
#print("\nSeconds request: ", getWeather(1533114780)) # Tuesday, 1 August 2018 09:13:00 GMT - test the cache