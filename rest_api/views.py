import datetime
import pytz

from django.db.models import Q
from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import ChannelInfo, FilterRecordingTracking, InvalidFrameTracking, Recording, RecordingTracking
from .serializers import ChannelInfoSerializer, FilterRecordingTrackingSerializer, InvalidFrameTrackingSerializer, RecordingSerializer, RecordingTrackingSerializer
from rest_framework.permissions import  IsAuthenticated

# Create your views here.


class GraphUIRedirectView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        request_id = request.GET.get('request_id')
        device_id = request.GET.get('device_id')
        recordings = Recording.objects.filter(request_id = request_id, device_id = device_id)
        serializer = RecordingSerializer(recordings, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        pass

class FilterRecordingTrackingView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        input_date = request.GET.get('date') or str(datetime.datetime.date(datetime.datetime.now()))
        channel_values = request.GET.getlist('channel_values') or list(map(str, ChannelInfo.objects.values_list('channel_value', flat=True)))
        yyyymmdd_date = "".join(input_date.split("-"))
        filter_recording_trackings = FilterRecordingTracking.objects.using('barc-prod').filter(request_id__startswith = yyyymmdd_date, channel_value__in = [int(x) for x in channel_values])
        serializer = FilterRecordingTrackingSerializer(filter_recording_trackings, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        pass

class RecordingTrackingView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        request_id = request.GET.get('request_id')
        device_id = request.GET.get('device_id')
        recording_tracking = RecordingTracking.objects.filter(request_id = request_id, device_id = device_id)
        serializer = RecordingTrackingSerializer(recording_tracking, many=True)
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

class RecordingView(APIView):
    permission_classes = (IsAuthenticated,)

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

        # construct the datetime objects by specifying the date, time and the timezone (using .localize()).
        start_datetime = input_timezone.localize(datetime.datetime.strptime(input_date + " " + input_start_time, "%Y-%m-%d %H:%M:%S.%f"))
        finish_datetime = input_timezone.localize(datetime.datetime.strptime(input_date + " " + input_finish_time, "%Y-%m-%d %H:%M:%S.%f"))

        # keep 1 min buffer for starting and ending times.
        start_datetime = start_datetime - datetime.timedelta(minutes=1)
        finish_datetime = finish_datetime + datetime.timedelta(minutes=1)
        
        # get the corresponding IST date and time values in string format 
        start_date_ist_str = start_datetime.astimezone(ist_timezone).strftime("%Y%m%d")
        start_time_ist_str = start_datetime.astimezone(ist_timezone).strftime("%H%M%S.%f")

        finish_date_ist_str = finish_datetime.astimezone(ist_timezone).strftime("%Y%m%d")
        finish_time_ist_str = finish_datetime.astimezone(ist_timezone).strftime("%H%M%S.%f")
        
        filters = {}
        
        if device_id != 'both':
            filters['device_id'] = device_id

        recordings = Recording.objects.filter(**filters)

        q = Q()
        for ch in channel_values:
            start = '_'.join([start_date_ist_str, ch, start_time_ist_str])
            finish = '_'.join([finish_date_ist_str, ch, finish_time_ist_str])
            q = q | (Q(request_id__range=[start, finish], channel_value = ch) & ~Q(stage_message__in = ["Start Recording", "Stop Recording"]))
        
        q = q | Q(stage_message__in = ["Start Recording", "Stop Recording"], timestamp__range = [start_datetime, finish_datetime], channel_value__in = [int(x) for x in channel_values])
        recordings = recordings.filter(q)
        
        serializer = RecordingSerializer(recordings, many=True)
        return Response(serializer.data)

        # temp_json = {
        #     'start_date_ist_str': start_date_ist_str,
        #     'start_time_ist_str': start_time_ist_str,
        #     'finish_date_ist_str': finish_date_ist_str,
        #     'finish_time_ist_str': finish_time_ist_str
        # }

        # return JsonResponse(temp_json)
    
    def post(self, request):
        pass

class BlankView(APIView):
    permission_classes = (IsAuthenticated,)
    
    def get(self, request):

        # #   retrieve the GET parameters
        device_id = request.GET.get('device_id') or 'both'
        input_date = request.GET.get('date') or str(datetime.datetime.date(datetime.datetime.now()))


        input_start_time = handle_buggy_time(request.GET.get('start_time')) or '00:00:00.000'
        input_finish_time = handle_buggy_time(request.GET.get('finish_time')) or '23:59:59.999'
        input_timezone = request.GET.get('timezone') or 'Asia/Kolkata'
        channel_values = request.GET.getlist('channel_values') or list(map(str, ChannelInfo.objects.values_list('channel_value', flat=True)))

        # temp_json = {
        #     'device_id': device_id,
        #     'input_date': input_date,
        #     'input_start_time': input_start_time,
        #     'input_finish_time': input_finish_time,
        #     'input_timezone': input_timezone,
        #     'channel_values': channel_values
        # }
        
        input_timezone = pytz.timezone(input_timezone)
        ist_timezone = pytz.timezone('Asia/Kolkata')

        # construct the datetime object by specifying the date, time and the timezone (using .localize()).
        start_datetime = input_timezone.localize(datetime.datetime.strptime(input_date + " " + input_start_time, "%Y-%m-%d %H:%M:%S.%f"))
        finish_datetime = input_timezone.localize(datetime.datetime.strptime(input_date + " " + input_finish_time, "%Y-%m-%d %H:%M:%S.%f"))

        # keep 1 min buffer for starting and ending times.
        start_datetime = start_datetime - datetime.timedelta(minutes=1)
        finish_datetime = finish_datetime + datetime.timedelta(minutes=1)
        
        # get the corresponding IST date and time values in string format.
        start_date_ist_str = start_datetime.astimezone(ist_timezone).strftime("%Y%m%d")
        start_time_ist_str = start_datetime.astimezone(ist_timezone).strftime("%H%M%S.%f")

        finish_date_ist_str = finish_datetime.astimezone(ist_timezone).strftime("%Y%m%d")
        finish_time_ist_str = finish_datetime.astimezone(ist_timezone).strftime("%H%M%S.%f")
        
        filters = {}
        
        if device_id != 'both':
            filters['device_id'] = device_id
        
        invalid_frame_trackings = InvalidFrameTracking.objects.filter(**filters)

        q = Q()
        for ch in channel_values:
            start = '_'.join([start_date_ist_str, ch, start_time_ist_str])
            finish = '_'.join([finish_date_ist_str, ch, finish_time_ist_str])
            
            # print("")
            # print("start request_id :- {}".format(start))
            # print("finish request_id :- {}".format(finish))
            # print("")

            q = q | (Q(request_id__range=[start, finish]) & Q(request_id__contains = '_' + ch + '_'))

        invalid_frame_trackings = invalid_frame_trackings.filter(q)        
        
        serializer = InvalidFrameTrackingSerializer(invalid_frame_trackings, many=True)
        return Response(serializer.data)
        # return JsonResponse(temp_json)
    
    def post(self, request):
        pass