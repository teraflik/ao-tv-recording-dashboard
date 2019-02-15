from django.shortcuts import render
from rest_api import models

# Getting the list of channels
channels = models.ChannelInfo.objects.all()

# Create your views here.
def d3_timeline(request):
    return render(request, 'graph_ui/d3-timeline-home.html')

def google_charts_timeline(request):
    return render(request, 'graph_ui/google-charts-timeline-home.html', {'channels': channels})