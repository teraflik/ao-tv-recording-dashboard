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
    return render(request, 'ui/datatable.html', {"request_params": request.GET})
    # return JsonResponse(request.GET)