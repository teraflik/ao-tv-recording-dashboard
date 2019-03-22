from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^recording/', views.RecordingView.as_view(), name='api-recording'),
    url(r'^recording_graph_ui_redirect/', views.GraphUIRedirectView.as_view()),
    url(r'^blank/', views.BlankView.as_view(), name='api-blank'),
    url(r'^filter_recording_tracking/', views.FilterRecordingTrackingView.as_view(), name='api-filter-recording-tracking'),
    url(r'^recording_tracking/', views.RecordingTrackingView.as_view(), name='api-recording-tracking'),
]