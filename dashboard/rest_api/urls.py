# -*- coding: utf-8 -*-
__author__ = "Asutosh Sahoo"
__copyright__ = "Copyright (©) 2019. Athenas Owl. All rights reserved."
__credits__ = ["Quantiphi Analytics"]

from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^recording/', views.RecordingView.as_view(), name='api-recording'),
    url(r'^recording_graph_ui_redirect/', views.GraphUIRedirectView.as_view()),
    url(r'^blank/', views.BlankView.as_view(), name='api-blank'),
    url(r'^filter_recording_tracking/', views.FilterRecordingTrackingView.as_view(), name='api-filter-recording-tracking'),
    url(r'^recording_tracking/', views.RecordingTrackingView.as_view(), name='api-recording-tracking'),
    url(r'^recording_guide/', views.RecordingGuideView.as_view(), name='api-recording-guide'),
]
