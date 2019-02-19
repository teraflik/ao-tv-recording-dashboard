from django.shortcuts import render
from django.apps import apps
from django.http import JsonResponse
from rest_api import models

# Getting the list of model names in a given app
_models = apps.get_app_config('rest_api').get_models()
model_names = list(map(lambda x: x._meta.db_table, _models))

# Getting the list of channels
channels = models.ChannelInfo.objects.values('channel_name', 'channel_value')

# helper methods
def make_table_html(myDict):
    
    if not myDict:
        return ''
    
    tableHeadHTML = ''
    tableBodyHTML = ''

    if myDict.get('date'):
        tableHeadHTML += '<th>Date</th>'
        tableBodyHTML += '<td>' + myDict.get('date') + '</td>'
    
    if myDict.get('start_time') and myDict.get('finish_time'):
        tableHeadHTML += '<th>Time Interval</th>'
        tableBodyHTML += '<td>' + myDict.get('start_time') + ' - ' + myDict.get('finish_time') + '</td>'
    
    if myDict.get('timezone'):
        tableHeadHTML += '<th>Timezone</th>'
        tableBodyHTML += '<td>' + myDict.get('timezone') + '</td>'
    
    if myDict.get('channel_names'):
        tableHeadHTML += '<th>Channel Names</th>'
        tableBodyHTML += '<td>' + str(myDict.get('channel_names')) + '</td>'
    
    if myDict.get('device_id'):
        tableHeadHTML += '<th>Device</th>'
        tableBodyHTML += '<td>' + myDict.get('device_id') + '</td>'
    
    if myDict.get('request_id'):
        tableHeadHTML += '<th>Request ID</th>'
        tableBodyHTML += '<td>' + myDict.get('request_id') + '</td>'

    tableHeadHTML = '<thead><tr>' + tableHeadHTML + '</tr></thead>'
    tableBodyHTML = '<tbody><tr>' + tableBodyHTML + '</tr></tbody>'

    tableHTML = '<table class="table table-bordered table-hover" style="font-size: 12px">' + tableHeadHTML + tableBodyHTML + '</table>'
    
    return tableHTML

# Create your views here.

def tables(request):
    return render(request, 'ui/datatable.html')

def home(request):
    return render(request, 'ui/home.html', {'channels': channels})

def general(request):
    myDict = dict(request.GET._iterlists())
    
    for key, value in myDict.items():
        if key != 'channel_values':
            myDict[key] = value[0]
    
    # map channel_values to channel_names and remove the channel_values key
    if myDict.get('channel_values'):
        channel_values = [int(x) for x in myDict['channel_values']]
        channel_names = [t['channel_name'] for t in channels.filter(channel_value__in=channel_values)]
        myDict['channel_names'] = channel_names
        myDict.pop("channel_values", None)

    return render(request, 'ui/datatable.html', {'tableHTML': make_table_html(myDict)})
    # return JsonResponse(request.GET)