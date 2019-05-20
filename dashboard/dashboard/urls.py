# -*- coding: utf-8 -*-
__author__ = "Asutosh Sahoo"
__copyright__ = "Copyright (©) 2019. Athenas Owl. All rights reserved."
__credits__ = ["Quantiphi Analytics"]

# Django related Dependencies
from django.conf import settings
from django.conf.urls import include, url
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.views.generic import TemplateView
from django.views.generic.base import RedirectView

# Project related dependencies
from ui.forms import LoginForm

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^api/', include('rest_api.urls')),
    url(r'^ui/', include('ui.urls')),
    url(r'^graph_ui/', include('graph_ui.urls')),
    url(r'^monitoring/', include('monitoring.urls')),
    url(r'^schedule/', include('schedule.urls')),
    url(r'^loss_analysis/', include('loss_analysis.urls')),
    url(r'^login/', auth_views.LoginView.as_view(template_name='ui/login.html', authentication_form=LoginForm, redirect_authenticated_user=True), name='login'),
    url(r'^logout/', auth_views.LogoutView.as_view(template_name='ui/logout.html'), name='logout'),
    url(r'^$', RedirectView.as_view(url='/graph_ui/recording', permanent=False), name='index'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
