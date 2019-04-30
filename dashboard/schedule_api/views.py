import datetime

from django.shortcuts import render
from django.template.response import TemplateResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Channel, Schedule
from .serializers import ChannelSerializer, ScheduleSerializer


class ChannelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated,]
    serializer_class = ChannelSerializer

    queryset = Channel.objects.all()
    filter_backends = (DjangoFilterBackend,)

class ScheduleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated,]
    serializer_class = ScheduleSerializer
    
    queryset = Schedule.objects.all()
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ('channel','monday', 'tuesday', 'wednesday', 'thursday',
        'friday', 'saturday', 'sunday')

class ScheduleHistoryAPIView(generics.ListAPIView):
    permission_classes = [IsAuthenticated,]
    serializer_class = ScheduleSerializer

    def get_queryset(self):
        date = self.request.query_params.get('date', None)
        channel = self.request.query_params.get('channel_values', None)
        device = self.request.query_params.get('device_id', None)

        query_map = {'pk': 'id', 'channel': 'channel_id', 'rec_start': 'rec_start', 'rec_stop': 'rec_stop'}
        
        if not date:
            queryset = Schedule.objects.raw("SELECT * FROM schedule_api_schedule \
                FOR SYSTEM_TIME AS OF CURRENT_TIMESTAMP", translations=query_map)
        else:
            timestamp = datetime.datetime.strptime(date,'%Y-%m-%d').strftime('%Y-%m-%d %H:%M:%S')
            queryset = Schedule.objects.raw("SELECT * FROM schedule_api_schedule \
            FOR SYSTEM_TIME AS OF TIMESTAMP'" + timestamp + "'", translations=query_map)
        
        if channel is not None:
            queryset = queryset.filter(channel__value=channel_value)

        if device is not None:
            queryset = queryset

        return queryset

def index(request):
    """
    Renders the Schedule page.
    """
    return TemplateResponse(request, 'schedule_api/index.html')
