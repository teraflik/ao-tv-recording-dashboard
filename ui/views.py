from django.shortcuts import render
from django.apps import apps
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

from rest_api import models
from . import utils

# Getting the list of model names in a given app
_models = apps.get_app_config('rest_api').get_models()
model_names = list(map(lambda x: x._meta.db_table, _models))

# Getting the list of channels
channels = models.ChannelInfo.objects.values('channel_name', 'channel_value')

# Create your views here.
@login_required
def home(request):
    return render(request, 'ui/home.html', {'channels': channels})

@login_required
def general(request):

    table_dict = utils.make_table_dict(request, channels)
    table_html = utils.make_table_html(table_dict)

    return render(request, 'ui/datatable.html', {'tableHTML': table_html})
    # return JsonResponse(request.GET)