import datetime
import pytz

from django.db.models import Q
from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import ChannelInfo, FilterRecordingTracking, InvalidFrameTracking, Recording, RecordingTracking
from .serializers import ChannelInfoSerializer, FilterRecordingTrackingSerializer, InvalidFrameTrackingSerializer, RecordingSerializer, RecordingTrackingSerializer
# Create your views here.

class GraphUIRedirectView(APIView):
    
    def get(self, request):
        request_id = request.GET.get('request_id')
        device_id = request.GET.get('device_id')
        recordings = Recording.objects.filter(request_id = request_id, device_id = device_id)
        serializer = RecordingSerializer(recordings, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        pass


def handle_buggy_time(input_time):
    if not input_time:
        return None
    elif len(input_time.split(".")) == 2:
        return input_time
    elif len(input_time.split(":")) == 3:
        return input_time + '.000'
    else:
        return input_time + ':00.000'

class GeneralView(APIView):
    
    def get(self, request):

        #   retrieve the GET parameters
        input_date = request.GET.get('date') or str(datetime.datetime.date(datetime.datetime.now()))
        input_start_time = handle_buggy_time(request.GET.get('start_time')) or '00:00:00.000'
        input_finish_time = handle_buggy_time(request.GET.get('finish_time')) or '23:59:59.999'
        input_timezone = request.GET.get('timezone') or 'Asia/Kolkata'
        channel_values = request.GET.getlist('channel_values') or list(map(str, ChannelInfo.objects.values_list('channel_value', flat=True)))
        device_id = request.GET.get('device_id') or 'both'

        input_timezone = pytz.timezone(input_timezone)
        ist_timezone = pytz.timezone('Asia/Kolkata')

        start_datetime = input_timezone.localize(datetime.datetime.strptime(input_date + " " + input_start_time, "%Y-%m-%d %H:%M:%S.%f"))
        finish_datetime = input_timezone.localize(datetime.datetime.strptime(input_date + " " + input_finish_time, "%Y-%m-%d %H:%M:%S.%f"))

        start_datetime = start_datetime - datetime.timedelta(minutes=1)
        finish_datetime = finish_datetime + datetime.timedelta(minutes=1)
        

        start_date_ist_str = start_datetime.astimezone(ist_timezone).strftime("%Y%m%d")
        start_time_ist_str = start_datetime.astimezone(ist_timezone).strftime("%H%M%S.%f")

        finish_date_ist_str = finish_datetime.astimezone(ist_timezone).strftime("%Y%m%d")
        finish_time_ist_str = finish_datetime.astimezone(ist_timezone).strftime("%H%M%S.%f")
        
        filters = {}
        
        if device_id != 'both':
            filters['device_id'] = device_id
        
        filters['channel_value__in'] = [int(x) for x in channel_values]

        recordings = Recording.objects.filter(**filters)

        q = Q()
        for ch in channel_values:
            start = '_'.join([start_date_ist_str, ch, start_time_ist_str])
            finish = '_'.join([finish_date_ist_str, ch, finish_time_ist_str])
            q = q | (Q(request_id__range=[start, finish]) & ~Q(stage_message__in = ["Start Recording", "Stop Recording"]))

        q = q | Q(stage_message__in = ["Start Recording", "Stop Recording"], timestamp__range = [start_datetime, finish_datetime])
        recordings = recordings.filter(q)        
        
        serializer = RecordingSerializer(recordings, many=True)
        return Response(serializer.data)
        # return JsonResponse(temp_json)
    
    def post(self, request):
        pass
