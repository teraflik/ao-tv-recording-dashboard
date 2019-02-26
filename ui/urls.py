from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^recording/', views.general, name='ui-recording'),
    url(r'^graph_ui_redirect', views.general),
    url(r'^home', views.home),
]