import os

from django.shortcuts import render

# Create your views here.

def index(request):
    """
    Renders the Reports page.
    """
    path = "/home/user/Documents/Data_Loss_Reports/"
    report_list = os.listdir(path)

    return render(request, 'loss_analysis/index.html', {
            'reports': report_list,
            'report_dir': path,
        })

def report(request, name):
    """
    Returns a particular report.
    """
    return render(request, 'loss_analysis/index.html')