from django.shortcuts import render
from django.template.response import TemplateResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Channel, Schedule
from .serializers import ScheduleSerializer, ChannelSerializer


def index(request):
    """
    Renders the Schedule page.
    """
    return TemplateResponse(request, 'schedule_api/index.html')

class ScheduleAPIView(APIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = ScheduleSerializer

    def get_queryset(self):
        """
        Optionally restricts the returned purchases to a given user,
        by filtering against a `username` query parameter in the URL.
        """
        queryset = Schedule.objects.all()
        channel = self.request.query_params.get('channel_id', None)
        if channel is not None:
            queryset = queryset.filter(channel=channel)
        return queryset

    # def get(self, request):
    #     channel = request.GET.get('channel_id') or None
    #     schedules = Schedule.objects.all()
    #     serializer = ScheduleSerializer(schedules, many=True)
    #     return Response(serializer.data)

    def post(self, request):
        pass

class ChannelAPIView(APIView):

    def get(self, request):
        channels = Channel.objects.all()
        print(schedules)
        serializer = ChannelSerializer(schedules, many=True)
        return Response(serializer.data)

    def post(self, request):
        pass
