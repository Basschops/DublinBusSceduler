from busy.settings import STATIC_ROOT
from django.http import HttpResponse

def busRoutesNew(num):
    with open('/staticfiles/bus_data/routes.txt', 'r', encoding='utf8') as file:
        return HttpResponse(file.read())

busRoutesNew(5)