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

    def get(self, request):
        schedules = Schedule.objects.all()
        serializer = ScheduleSerializer(schedules, many=True)
        return Response(serializer.data)

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
