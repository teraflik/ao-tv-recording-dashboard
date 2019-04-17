# -*- coding: utf-8 -*-
__author__ = "Asutosh Sahoo"
__copyright__ = "Copyright (©) 2019. Athenas Owl. All rights reserved."
__credits__ = ["Quantiphi Analytics"]

import datetime

import pytz
from django.db.models import Q
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (ChannelInfo, ExpectedSlot, FilterRecordingTracking,
                     InvalidFrameTracking, Recording, RecordingTracking)
from .serializers import (ChannelInfoSerializer, ExpectedSlotSerializer,
                          FilterRecordingTrackingSerializer,
                          InvalidFrameTrackingSerializer, RecordingSerializer,
                          RecordingTrackingSerializer)


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

        # get the input params
        input_date = request.GET.get('date') or str(datetime.datetime.date(datetime.datetime.now()))
        channel_values = request.GET.getlist('channel_values') or ChannelInfo.objects.values_list('channel_value', flat=True)
        
        yyyymmdd_date = "".join(input_date.split("-"))
        
        # ensures channel_values is a list of integers
        try:
            channel_values_int = [int(x) for x in channel_values]
        except ValueError as error:
            channel_values_int = []

        filter_recording_trackings = FilterRecordingTracking.objects.filter(request_id__startswith = yyyymmdd_date, channel_value__in = channel_values_int)
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

        # retrieve the GET parameters
        input_date = request.GET.get('date') or str(datetime.datetime.date(datetime.datetime.now()))
        input_start_time = handle_buggy_time(request.GET.get('start_time')) or '00:00:00.000'
        input_finish_time = handle_buggy_time(request.GET.get('finish_time')) or '23:59:59.999'
        input_timezone = request.GET.get('timezone') or 'Asia/Kolkata'
        channel_values = request.GET.getlist('channel_values') or list(map(str, ChannelInfo.objects.values_list('channel_value', flat=True)))
        device_id = request.GET.get('device_id') or 'both'

        filters = {}

        try:
            input_timezone = pytz.timezone(input_timezone)
            ist_timezone = pytz.timezone('Asia/Kolkata')

            # construct the datetime objects by specifying the date, time and the timezone (using .localize()).
            start_datetime = input_timezone.localize(datetime.datetime.strptime(input_date + " " + input_start_time, "%Y-%m-%d %H:%M:%S.%f"))
            finish_datetime = input_timezone.localize(datetime.datetime.strptime(input_date + " " + input_finish_time, "%Y-%m-%d %H:%M:%S.%f"))

            # # keep 1 min buffer for starting and ending times.
            # start_datetime = start_datetime - datetime.timedelta(minutes=1)
            # finish_datetime = finish_datetime + datetime.timedelta(minutes=1)
            
            # get the corresponding IST date and time values in string format 
            start_date_ist_str = start_datetime.astimezone(ist_timezone).strftime("%Y%m%d")
            start_time_ist_str = start_datetime.astimezone(ist_timezone).strftime("%H%M%S.%f")

            finish_date_ist_str = finish_datetime.astimezone(ist_timezone).strftime("%Y%m%d")
            finish_time_ist_str = finish_datetime.astimezone(ist_timezone).strftime("%H%M%S.%f")

            channel_values_int = [int(x) for x in channel_values]
        
        except Exception as e:
            # set values such that response is empty
            filters['request_id'] = 'invalid'

        if device_id != 'both':
            filters['device_id'] = device_id

        recordings = Recording.objects.filter(**filters)

        if recordings.count() > 0:
            q = Q()
            for ch in channel_values:
                start = '_'.join([start_date_ist_str, ch, start_time_ist_str])
                finish = '_'.join([finish_date_ist_str, ch, finish_time_ist_str])
                q = q | (Q(request_id__range=[start, finish], channel_value = ch) & ~Q(stage_message__in = ["Start Recording", "Stop Recording"]))
            
            q = q | Q(stage_message__in = ["Start Recording", "Stop Recording"], timestamp__range = [start_datetime, finish_datetime], channel_value__in = channel_values_int)
            recordings = recordings.filter(q)
        
        serializer = RecordingSerializer(recordings, many=True)
        return Response(serializer.data)
    
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

        filters = {}

        try:
            input_timezone = pytz.timezone(input_timezone)
            ist_timezone = pytz.timezone('Asia/Kolkata')

            # construct the datetime object by specifying the date, time and the timezone (using .localize()).
            start_datetime = input_timezone.localize(datetime.datetime.strptime(input_date + " " + input_start_time, "%Y-%m-%d %H:%M:%S.%f"))
            finish_datetime = input_timezone.localize(datetime.datetime.strptime(input_date + " " + input_finish_time, "%Y-%m-%d %H:%M:%S.%f"))

            # # keep 1 min buffer for starting and ending times.
            # start_datetime = start_datetime - datetime.timedelta(minutes=1)
            # finish_datetime = finish_datetime + datetime.timedelta(minutes=1)
            
            # get the corresponding IST date and time values in string format.
            start_date_ist_str = start_datetime.astimezone(ist_timezone).strftime("%Y%m%d")
            start_time_ist_str = start_datetime.astimezone(ist_timezone).strftime("%H%M%S.%f")

            finish_date_ist_str = finish_datetime.astimezone(ist_timezone).strftime("%Y%m%d")
            finish_time_ist_str = finish_datetime.astimezone(ist_timezone).strftime("%H%M%S.%f")
            

        except Exception as e:
            # set values such that response is empty
            filters['request_id'] = 'invalid'
        
        if device_id != 'both':
            filters['device_id'] = device_id
        
        invalid_frame_trackings = InvalidFrameTracking.objects.filter(**filters)

        if invalid_frame_trackings.count() > 0:
            q = Q()
            for ch in channel_values:
                start = '_'.join([start_date_ist_str, ch, start_time_ist_str])
                finish = '_'.join([finish_date_ist_str, ch, finish_time_ist_str])
                q = q | (Q(request_id__range=[start, finish]) & Q(request_id__contains = '_' + ch + '_'))

            invalid_frame_trackings = invalid_frame_trackings.filter(q)        
        
        serializer = InvalidFrameTrackingSerializer(invalid_frame_trackings, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        pass

class ExpectedSlotView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):

        # get the input params
        input_date = request.GET.get('date') or str(datetime.datetime.date(datetime.datetime.now()))
        channel_values = request.GET.getlist('channel_values') or ChannelInfo.objects.values_list('channel_value', flat=True)
        device_id = request.GET.get('device_id') or 'both'
        
        utc_timezone = pytz.timezone('UTC')
        filters = {}
        # ensures channel_values is a list of integers
        try:
            channel_values_int = [int(x) for x in channel_values]
            input_datetime_object = utc_timezone.localize(datetime.datetime.strptime(input_date, "%Y-%m-%d"))
            
            filters['channel_value__in'] = channel_values_int
            filters['validity_start__lte'] = input_datetime_object
            filters['validity_stop__gte'] = input_datetime_object
        
        except ValueError as error:
            filters['channel_value__in'] = []

        if device_id != 'both':
            filters['device_id'] = device_id

        expected_slots = ExpectedSlot.objects.filter(**filters)
        serializer = ExpectedSlotSerializer(expected_slots, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        pass
