from django.urls import path
from . import views

app_name = 'monitoring'
urlpatterns = [
    path('nodes/', views.nodes_index, name='nodes_index'),
    path('nodes/data/', views.nodes, name='nodes'),
    path('nodes/data/<node_id>', views.nodes, name='nodes'),
    path('nodes/data/<node_id>/deploy', views.deploy, name='deploy'),
    path('nodes/data/<node_id>/screenshot', views.screenshot, name='screenshot'),
    path('nodes/data/<node_id>/obs', views.obs, name='obs'),

    path('recording_guides/', views.recording_guides_index, name='recording_guides_index'),
    path('recording_guides/data/', views.recording_guides, name='recording_guides'),
]