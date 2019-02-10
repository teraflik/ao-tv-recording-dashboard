import datetime
import pytz

from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import ChannelInfo, FilterRecordingTracking, InvalidFrameTracking, Recording, RecordingTracking
from .serializers import ChannelInfoSerializer, FilterRecordingTrackingSerializer, InvalidFrameTrackingSerializer, RecordingSerializer, RecordingTrackingSerializer
# Create your views here.

class ChannelInfoView(APIView):
    
    def get(self, request):
        channel_infos = ChannelInfo.objects.all()
        serializer = ChannelInfoSerializer(channel_infos, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        pass

class RecordingView(APIView):
    
    def get(self, request):
        recordings = Recording.objects.all()[:20]
        serializer = RecordingSerializer(recordings, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        pass

class RecordingTrackingView(APIView):
    
    def get(self, request):
        recording_trackings = RecordingTracking.objects.all()[:20]
        serializer = RecordingTrackingSerializer(recording_trackings, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        pass

class InvalidFrameTrackingView(APIView):
    
    def get(self, request):
        invalid_frame_trackings = InvalidFrameTracking.objects.all()[:20]
        serializer = InvalidFrameTrackingSerializer(invalid_frame_trackings, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        pass

class FilterRecordingTrackingView(APIView):
    
    def get(self, request):
        filter_recording_trackings = FilterRecordingTracking.objects.all()[:20]
        serializer = FilterRecordingTrackingSerializer(filter_recording_trackings, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        pass

def handle_buggy_time(input_time):
    if len(input_time.split(".")) == 2:
        return input_time
    elif len(input_time.split(":")) == 3:
        return input_time + '.000'
    else:
        return input_time + ':00.000'

class GeneralView(APIView):
    
    def get(self, request):

        input_date = request.GET.get('date')
        input_start_time = handle_buggy_time(request.GET.get('start_time'))
        input_finish_time = handle_buggy_time(request.GET.get('finish_time'))
        input_timezone = request.GET.get('timezone')
        channel_values = request.GET.getlist('channel_values')
        device_id = request.GET.get('device_id')

        input_timezone = pytz.timezone(input_timezone)
        start_datetime = input_timezone.localize(datetime.datetime.strptime(input_date + " " + input_start_time, "%Y-%m-%d %H:%M:%S.%f"))
        finish_datetime = input_timezone.localize(datetime.datetime.strptime(input_date + " " + input_finish_time, "%Y-%m-%d %H:%M:%S.%f"))
        
        filters = {}
        
        # filters['show_timestamp__range'] = [start_datetime, finish_datetime]
        
        if device_id != 'both':
            filters['device_id'] = device_id
        
        filters['channel_value__in'] = [int(x) for x in channel_values]

        recordings = Recording.objects.filter(**filters)

        ans = [obj for obj in recordings.all() if obj.show_timestamp > start_datetime and obj.show_timestamp < finish_datetime]
        serializer = RecordingSerializer(ans, many=True)
        
        return Response(serializer.data)
        # return JsonResponse(request.GET)
    
    def post(self, request):
        pass
