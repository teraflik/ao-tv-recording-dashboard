import os
import time
import json
import csv
import requests
from requests_toolbelt import MultipartEncoder

from pathlib import Path

from django.shortcuts import render
from django.apps import apps
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from django.template import loader

from rest_api import models
from . import utils

# Getting the list of model names in a given app
_models = apps.get_app_config('rest_api').get_models()
model_names = list(map(lambda x: x._meta.db_table, _models))

# Getting the list of channels
channels = models.ChannelInfo.objects.values('channel_name', 'channel_value')

# EMAIL CLOUD FUNCTION URL
EMAIL_CLOUD_FUNCTION_URL = 'https://us-central1-athenas-owl-dev.cloudfunctions.net/cf-send-attach-mail-generic'
AUTH_KEY = 'AOPlatform'

# Create your views here.
@login_required
def home(request):
    return render(request, 'ui/home.html', {'channels': channels})

@login_required
def daily_report_home(request):
    return render(request, 'ui/daily_report_home.html', {'channels': channels})

@login_required
def daily_report(request):

    table_dict = utils.make_table_dict(request, channels)
    table_html = utils.make_table_html(table_dict)

    return render(request, 'ui/daily_report.html', {'channels': channels, 'tableHTML': table_html})

@login_required
def weekly_report_home(request):
    return render(request, 'ui/weekly_report_home.html', {'channels': channels})

@login_required
def weekly_report(request):

    table_dict = utils.make_table_dict(request, channels)
    table_html = utils.make_table_html(table_dict)

    return render(request, 'ui/weekly_report.html', {'channels': channels, 'tableHTML': table_html})

@login_required
def general(request):

    table_dict = utils.make_table_dict(request, channels)
    table_html = utils.make_table_html(table_dict)

    return render(request, 'ui/datatable.html', {'tableHTML': table_html})
    # return JsonResponse(request.GET)

@login_required
@csrf_exempt
def send_mail(request):
    
    if request.method == 'POST':
        
        # extract parameters
        recipient_mail = request.POST.get('recipient_mail')
        filename = request.POST.get('filename')
        datatable_export = json.loads(request.POST.get('datatable_export'))
        
        report_type = request.POST.get('report_type')
        dates = request.POST.get('dates')

        filename = '/tmp/' + filename

        # write the data to csv
        with open(filename, mode='w') as csv_file:
            fieldnames = datatable_export['header']
            writer = csv.writer(csv_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)

            writer.writerow(fieldnames)

            for row in datatable_export['body']:
                writer.writerow(row)

        # send the csv via mail
        email_message = loader.render_to_string('ui/email_content.html', {'report_type': report_type, 'dates': dates}, using=None)
        fields ={'file': (filename, open(filename, 'rb')), 'receiver': recipient_mail, 'subject': 'Blank Frames Report', 'message': email_message, 'key': AUTH_KEY}
        
        data = MultipartEncoder(fields = fields)
        response = requests.post('https://us-central1-athenas-owl-dev.cloudfunctions.net/cf-send-attach-mail-generic', data=data, headers={'Content-Type': data.content_type})
        
        # remove file
        os.remove(filename)

        # return response
        return HttpResponse(status = response.status_code)