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
        channel_value = self.request.query_params.get('channel_values', None)
        device = self.request.query_params.get('device_id', None)

        query_map = {'pk': 'id', 'channel': 'channel_id', 'rec_start': 'rec_start', 'rec_stop': 'rec_stop'}
        
        # If no date is provided, use current table state
        if not date:
            query_string = "SELECT * FROM schedule_schedule FOR SYSTEM_TIME AS OF CURRENT_TIMESTAMP"
        else:
            timestamp = datetime.datetime.strptime(date,'%Y-%m-%d').strftime('%Y-%m-%d %H:%M:%S')
            query_string = "SELECT * FROM schedule_schedule FOR SYSTEM_TIME AS OF TIMESTAMP '" + timestamp + "'"
        
        if channel_value is not None:
            try:
                channel = Channel.objects.get(value=channel_value).id
                query_string = query_string + " WHERE channel_id = " + str(channel)
            except Channel.DoesNotExist:
                return Channel.objects.none()

        if device is not None:
            query_string = query_string #Can't filter on device.

        queryset = Schedule.objects.raw(query_string, translations=query_map)

        return queryset

def index(request):
    """
    Renders the Schedule page.
    """
    return TemplateResponse(request, "schedule/index.html")
