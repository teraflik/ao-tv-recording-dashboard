from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^recording', views.recording, name='graph-recording'),
    url(r'^blank', views.blank, name='graph-blank'),
    url(r'^filter_recording_tracking', views.filter_recording_tracking, name='graph-filter-recording-tracking'),
]
