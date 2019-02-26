from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^google-charts-timeline', views.google_charts_timeline),
]