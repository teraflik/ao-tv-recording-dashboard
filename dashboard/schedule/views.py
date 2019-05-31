import datetime
import calendar

from django.shortcuts import render
from django.template.response import TemplateResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Channel, NodeAllocation, Schedule
from monitoring.models import Node
from .serializers import ChannelSerializer, ScheduleSerializer, NodeSerializer


class ChannelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated,]
    serializer_class = ChannelSerializer

    queryset = Channel.objects.all()
    filter_backends = (DjangoFilterBackend,)

class NodeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated,]
    serializer_class = NodeSerializer
    
    queryset = Node.objects.all()

class ScheduleAPIView(generics.ListAPIView):
    permission_classes = [IsAuthenticated,]
    serializer_class = ScheduleSerializer

    def get_queryset(self):
        date = self.request.query_params.get('date',str(datetime.datetime.date(datetime.datetime.now())))
        channel_value = self.request.query_params.get('channel_values', None)
        device = self.request.query_params.get('device_id', None)

        date_object = datetime.datetime.strptime(date,'%Y-%m-%d')
        weekday = calendar.day_name[date_object.weekday()].lower()

        queryset = Schedule.objects.all()
        queryset = queryset.filter(
            validity_start__lte = date_object,
            validity_end__gte = date_object,
            **{weekday: True}
            )

        if channel_value is not None:
            queryset = queryset.filter(channel__value = channel_value)
        else:
            queryset = queryset
        
        if device is not None:
            queryset = queryset.filter(nodeallocation__label= device)
        else:
            queryset = queryset

        return queryset

def index(request):
    """
    Renders the Schedule page.
    """
    return TemplateResponse(request, "schedule/index.html")
