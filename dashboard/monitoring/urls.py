from django.urls import path
from . import views

app_name = 'monitoring'
urlpatterns = [
    path('', views.index, name='index'),
    path('nodes/', views.nodes, name='nodes'),
    path('nodes/<node_id>', views.nodes, name='nodes'),
    path('nodes/<node_id>/deploy', views.deploy, name='deploy'),
    path('nodes/<node_id>/screenshot', views.screenshot, name='screenshot'),
    path('nodes/<node_id>/obs', views.obs, name='obs')
]