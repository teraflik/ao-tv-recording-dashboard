from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^recording/', views.general, name='ui-recording'),
    url(r'^recording_graph_ui_redirect', views.general),
    url(r'^blank', views.general, name='ui-blank'),
    url(r'^home', views.home, name='ui-home'),
    url(r'^report', views.report, name='ui-report'),
    url(r'^send_mail', views.send_mail, name='ui-mail'),
]