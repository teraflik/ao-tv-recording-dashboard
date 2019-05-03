from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^recording_graph_ui_redirect', views.general),
    url(r'^daily_report_home', views.daily_report_home, name='ui-daily-report-home'),
    url(r'^weekly_report_home', views.weekly_report_home, name='ui-weekly-report-home'),
    url(r'^daily_report', views.daily_report, name='ui-daily-report'),
    url(r'^weekly_report', views.weekly_report, name='ui-weekly-report'),
    url(r'^send_mail', views.mail_report, name='ui-mail'),
]