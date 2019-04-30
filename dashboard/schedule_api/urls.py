from django.urls import include, path
from rest_framework import routers

from . import views

app_name = 'schedule_api'

router = routers.DefaultRouter()
router.register(r'channels', views.ChannelViewSet)
router.register(r'schedules', views.ScheduleViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/schedule_history/', views.ScheduleHistoryAPIView.as_view()),
    path('', views.index, name='index'),
]