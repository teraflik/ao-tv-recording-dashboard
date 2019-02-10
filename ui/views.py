from django.shortcuts import render
from django.apps import apps
from django.http import JsonResponse
from rest_api import models

# Getting the list of model names in a given app
_models = apps.get_app_config('rest_api').get_models()
model_names = list(map(lambda x: x._meta.db_table, _models))

# Getting the list of channels
channels = models.ChannelInfo.objects.values('channel_name', 'channel_value')

# Create your views here.

def tables(request):
    return render(request, 'ui/tabulator.html', {'models': model_names})

def home(request):
    return render(request, 'ui/home.html', {'channels': channels})

def general(request):
    myDict = dict(request.GET._iterlists())
    
    for key, value in myDict.items():
        if key != 'channel_values':
            myDict[key] = value[0]
    
    # map channel_values to channel_names
    channel_values = [int(x) for x in myDict['channel_values']]
    channel_names = [t['channel_name'] for t in channels.filter(channel_value__in=channel_values)]
    myDict['channel_names'] = channel_names

    return render(request, 'ui/datatable.html', myDict)
    # return JsonResponse(request.GET)