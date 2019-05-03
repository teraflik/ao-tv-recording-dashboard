# -*- coding: utf-8 -*-
__author__ = "Asutosh Sahoo"
__copyright__ = "Copyright (©) 2019. Athenas Owl. All rights reserved."
__credits__ = ["Quantiphi Analytics"]

# Python dependencies
import json
import os
import time

# Django dependencies
from django.apps import apps
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.shortcuts import render
from django.template import loader
from django.views.decorators.csrf import csrf_exempt, csrf_protect

# Project dependencies
from rest_api import models
from common.util.constants import Constant
from . import utils

# Getting the list of channels
channels = models.ChannelInfo.objects.values('channel_name', 'channel_value')

@login_required
def daily_report_home(request):
    '''
    Page to select date for daily report.
    '''

    return render(request, 'ui/daily_report_home.html')

@login_required
def daily_report(request):
    '''
    Page that displays daily reports.
    '''

    table_dict = utils.make_table_dict(request, channels)
    table_html = utils.make_table_html(table_dict)

    return render(request, 'ui/daily_report.html', {'channels': channels, 'tableHTML': table_html})

@login_required
def weekly_report_home(request):
    '''
    Page to select date range for weekly reports.
    '''

    return render(request, 'ui/weekly_report_home.html')

@login_required
def weekly_report(request):
    '''
    Page that displays weekly reports.
    '''

    table_dict = utils.make_table_dict(request, channels)
    table_html = utils.make_table_html(table_dict)

    return render(request, 'ui/weekly_report.html', {'channels': channels, 'tableHTML': table_html})

@login_required
def general(request):
    '''
    A generic page that displays the dataTable UI for a given database table.
    '''
    
    table_dict = utils.make_table_dict(request, channels)
    table_html = utils.make_table_html(table_dict)

    return render(request, 'ui/datatable.html', {'tableHTML': table_html})

@login_required
@csrf_exempt
def mail_report(request):
    '''
    1. Recieve the report data to be sent in mail,
    2. Prepare CSV attachment
    3. Send mail
    4. Delete generated attachment file
    5. Return response code
    '''
    
    if request.method == 'POST':
        
        # extract parameters
        receiver_email = request.POST.get('receiver_email')
        filename = request.POST.get('filename')
        datatable_export = json.loads(request.POST.get('datatable_export'))
        report_type = request.POST.get('report_type')
        dates = request.POST.get('dates')

        filepath = Constant.TEMPORARY_STORAGE_PATH + filename

        # write the datatable_export to csv
        utils.write_datatable_export_to_csv(datatable_export, filepath)
        
        # prepare message of the mail
        email_message = loader.render_to_string('ui/email_content.html', {'report_type': report_type, 'dates': dates}, using=None)

        # send the mail
        response = utils.send_attached_mail(receiver_email=receiver_email, subject='Blank Frames Report', message=email_message, attachment={"name": filename, "path": filepath})
        
        # remove file
        os.remove(filepath)

        # return response
        return HttpResponse(status = response.status_code)
