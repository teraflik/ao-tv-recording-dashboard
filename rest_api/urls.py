from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^get/', views.GeneralView.as_view()),
    url(r'^graph_ui_redirect/', views.GraphUIRedirectView.as_view()),
]