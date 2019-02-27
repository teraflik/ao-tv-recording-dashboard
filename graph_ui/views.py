from django.shortcuts import render
from rest_api import models

# Getting the list of channels
channels = models.ChannelInfo.objects.all()

def recording(request):
    return render(request, 'graph_ui/recording.html', {'channels': channels})

def blank(request):
    return render(request, 'graph_ui/blank.html', {'channels': channels})