from django.urls import path
from . import views

app_name = 'schedule_api'

urlpatterns = [
    path('', views.index, name='index'),
    path('api/', views.ScheduleAPIView.as_view(), name='schedule_api'),
]