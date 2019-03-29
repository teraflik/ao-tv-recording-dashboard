import os
import time
import json
import csv
import requests
from pathlib import Path

from django.shortcuts import render
from django.apps import apps
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_protect, csrf_exempt

from rest_api import models
from . import utils

# Getting the list of model names in a given app
_models = apps.get_app_config('rest_api').get_models()
model_names = list(map(lambda x: x._meta.db_table, _models))

# Getting the list of channels
channels = models.ChannelInfo.objects.values('channel_name', 'channel_value')

# EMAIL CLOUD FUNCTION URL
EMAIL_CLOUD_FUNCTION_URL = 'https://us-central1-athenas-owl-dev.cloudfunctions.net/cf-testattachmail'


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

@login_required
def report(request):
    return render(request, 'ui/report.html', {'channels': channels})

@login_required
@csrf_exempt
def send_mail(request):
    
    if request.method == 'POST':
        
        # extract parameters
        recipient_mail = request.POST.get('recipient_mail')
        filename = request.POST.get('filename')
        datatable_export = json.loads(request.POST.get('datatable_export'))

        # write the data to csv
        with open(filename, mode='w') as csv_file:
            fieldnames = datatable_export['header']
            writer = csv.writer(csv_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)

            writer.writerow(fieldnames)

            for row in datatable_export['body']:
                writer.writerow(row)

        # send the csv via mail
        files = {'file': open(filename, 'rb'), "recipient_mail": recipient_mail}
        response = requests.request("POST", EMAIL_CLOUD_FUNCTION_URL, files=files)
        
        # remove file
        os.remove(filename)

        # return response
        return HttpResponse(status = response.status_code)