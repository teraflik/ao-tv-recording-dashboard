from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^get/', views.general),
    url(r'^graph_ui_redirect', views.general),
    url(r'^home', views.home),
    url(r'', views.tables),
]