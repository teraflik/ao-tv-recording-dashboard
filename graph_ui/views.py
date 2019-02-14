from django.shortcuts import render
# Create your views here.

def d3_timeline(request):
    return render(request, 'graph_ui/d3-timeline-home.html')