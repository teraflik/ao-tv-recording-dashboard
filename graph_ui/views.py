from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from rest_api import models

# Getting the list of channels
channels = models.ChannelInfo.objects.all()

@login_required
def recording(request):
    return render(request, 'graph_ui/recording.html', {'channels': channels})

@login_required
def blank(request):
    return render(request, 'graph_ui/blank.html', {'channels': channels})

@login_required
def filter_recording_tracking(request):
    return render(request, 'graph_ui/filter_recording_tracking.html', {'channels': channels})
