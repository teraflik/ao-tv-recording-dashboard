from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^recording', views.recording, name='graph-recording'),
    url(r'^blank', views.blank, name='graph-blank'),
]