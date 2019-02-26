from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^recording/', views.RecordingView.as_view(), name='api-recording'),
    url(r'^graph_ui_redirect/', views.GraphUIRedirectView.as_view()),
]