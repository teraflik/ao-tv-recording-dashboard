from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^d3-timeline', views.d3_timeline),
    url(r'^google-charts-timeline', views.google_charts_timeline),
]