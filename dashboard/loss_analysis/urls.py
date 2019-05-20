from django.urls import path
from . import views

app_name = 'loss_analysis'

urlpatterns = [
    path('', views.index, name='index'),
    path('report/<name>', views.report, name='report'),
]