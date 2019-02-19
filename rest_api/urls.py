from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^get/', views.GeneralView.as_view()),
    url(r'^request_id_filter/', views.RequestIDFilterView.as_view()),
    url(r'^channel_info/', views.ChannelInfoView.as_view()),
    url(r'^recording/', views.RecordingView.as_view()),
    url(r'^recording_tracking/', views.RecordingTrackingView.as_view()),
    url(r'^invalid_frame_tracking/', views.InvalidFrameTrackingView.as_view()),
    url(r'^filter_recording_tracking/', views.FilterRecordingTrackingView.as_view()),
]