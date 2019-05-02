# -*- coding: utf-8 -*-
__author__ = "Asutosh Sahoo"
__copyright__ = "Copyright (©) 2019. Athenas Owl. All rights reserved."
__credits__ = ["Quantiphi Analytics"]

import calendar
import datetime

import pytz
from django.db.models import Q
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.util import utils

from .models import (ChannelInfo, FilterRecordingTracking,
                     InvalidFrameTracking, Recording, RecordingGuide,
                     RecordingTracking)
from .serializers import (ChannelInfoSerializer,
                          FilterRecordingTrackingSerializer,
                          InvalidFrameTrackingSerializer,
                          RecordingGuideSerializer, RecordingSerializer,
                          RecordingTrackingSerializer)


class RecordingView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):

        # 1. Retrieving the GET parameters
        input_date = request.GET.get('date') or str(datetime.datetime.date(datetime.datetime.now()))
        input_start_time = utils.handle_buggy_time(request.GET.get('start_time')) or '00:00:00.000'
        input_finish_time = utils.handle_buggy_time(request.GET.get('finish_time')) or '23:59:59.999'
        input_timezone = request.GET.get('timezone') or 'Asia/Kolkata'
        channel_values = request.GET.getlist('channel_values') or list(map(str, ChannelInfo.objects.values_list('channel_value', flat=True)))
        device_id = request.GET.get('device_id') or 'all'

        # 2. initialize the result with entire table.
        recordings = Recording.objects.all()

        # 3. filtering the result using GET parameters.
        try:
            
            # A. PRE-PROCESSING GET PARAMETERS TO GET FILTER VALUES.
            
            # i. construct the datetime objects for START_TIME & FINISH_TIME by specifying the date, time and timezone.
            input_timezone = pytz.timezone(input_timezone)
            ist_timezone = pytz.timezone('Asia/Kolkata')

            start_datetime = input_timezone.localize(datetime.datetime.strptime(input_date + " " + input_start_time, "%Y-%m-%d %H:%M:%S.%f"))
            finish_datetime = input_timezone.localize(datetime.datetime.strptime(input_date + " " + input_finish_time, "%Y-%m-%d %H:%M:%S.%f"))
            
            # ii. Convert both the datetimes into IST and get their string representation.
            start_date_ist_str = start_datetime.astimezone(ist_timezone).strftime("%Y%m%d")
            start_time_ist_str = start_datetime.astimezone(ist_timezone).strftime("%H%M%S.%f")

            finish_date_ist_str = finish_datetime.astimezone(ist_timezone).strftime("%Y%m%d")
            finish_time_ist_str = finish_datetime.astimezone(ist_timezone).strftime("%H%M%S.%f")

            # iii. Convert the list_of_strings of channel_values to list_of_integers.
            channel_values_int = [int(x) for x in channel_values]

            
            # B. APPLYING FILTERS

            # i. If device_id is not all, then add the device_id filter as well.
            if device_id != 'all':
                recordings = recordings.filter(device_id = device_id)            

            # ii. Filter the Start/Stop Recording entries using the datetime objects on the `timestamp` attribute.
            q = Q(stage_message__in = ["Start Recording", "Stop Recording"], timestamp__range = [start_datetime, finish_datetime], channel_value__in = channel_values_int)
            
            # iii. Filter the remaining `clip entries` by generating range of request_id corresponding to the time strings calculated in previous steps.            
            for ch in channel_values:
                start_request_id = '_'.join([start_date_ist_str, ch, start_time_ist_str])
                finish_request_id = '_'.join([finish_date_ist_str, ch, finish_time_ist_str])
                q = q | (Q(request_id__range=[start_request_id, finish_request_id], channel_value = ch) & ~Q(stage_message__in = ["Start Recording", "Stop Recording"]))
            
            recordings = recordings.filter(q)

        # Incase, if any exception occurs while any of the above processing steps, return an empty queryset.
        except (pytz.exceptions.UnknownTimeZoneError, ValueError) as e:
            recordings = Recording.objects.none()
        
        # 4. Serialize the queryset and return.
        serializer = RecordingSerializer(recordings, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        pass

class BlankView(APIView):
    permission_classes = (IsAuthenticated,)
    
    def get(self, request):

        # 1. Retrieving the GET parameters
        device_id = request.GET.get('device_id') or 'all'
        input_date = request.GET.get('date') or str(datetime.datetime.date(datetime.datetime.now()))
        input_start_time = utils.handle_buggy_time(request.GET.get('start_time')) or '00:00:00.000'
        input_finish_time = utils.handle_buggy_time(request.GET.get('finish_time')) or '23:59:59.999'
        input_timezone = request.GET.get('timezone') or 'Asia/Kolkata'
        channel_values = request.GET.getlist('channel_values') or list(map(str, ChannelInfo.objects.values_list('channel_value', flat=True)))

        # 2. initialize the result with entire table.
        invalid_frame_trackings = InvalidFrameTracking.objects.all()

        # 3. filtering the result using GET parameters.
        try:
            # A. PRE-PROCESSING GET PARAMETERS TO GET FILTER VALUES.
            
            # i. construct the datetime objects for START_TIME & FINISH_TIME by specifying the date, time and timezone.
            input_timezone = pytz.timezone(input_timezone)
            ist_timezone = pytz.timezone('Asia/Kolkata')

            start_datetime = input_timezone.localize(datetime.datetime.strptime(input_date + " " + input_start_time, "%Y-%m-%d %H:%M:%S.%f"))
            finish_datetime = input_timezone.localize(datetime.datetime.strptime(input_date + " " + input_finish_time, "%Y-%m-%d %H:%M:%S.%f"))
            
            # ii. Convert both the datetimes into IST and get their string representation.
            start_date_ist_str = start_datetime.astimezone(ist_timezone).strftime("%Y%m%d")
            start_time_ist_str = start_datetime.astimezone(ist_timezone).strftime("%H%M%S.%f")

            finish_date_ist_str = finish_datetime.astimezone(ist_timezone).strftime("%Y%m%d")
            finish_time_ist_str = finish_datetime.astimezone(ist_timezone).strftime("%H%M%S.%f")

            # B. APPLYING FILTERS

            # i. If device_id is not all, then add the device_id filter as well.
            if device_id != 'all':
                invalid_frame_trackings = invalid_frame_trackings.filter(device_id = device_id)
            
            # ii. Filter the entries by generating range of request_id corresponding to the time strings calculated in previous steps.
            q = Q()
            for ch in channel_values:
                start = '_'.join([start_date_ist_str, ch, start_time_ist_str])
                finish = '_'.join([finish_date_ist_str, ch, finish_time_ist_str])
                q = q | (Q(request_id__range=[start, finish]) & Q(request_id__contains = '_' + ch + '_'))
            invalid_frame_trackings = invalid_frame_trackings.filter(q)

        # Incase, if any exception occurs while any of the above processing steps, return an empty queryset.
        except (pytz.exceptions.UnknownTimeZoneError, ValueError) as e:
            invalid_frame_trackings = InvalidFrameTracking.objects.none()
                
        # 4. Serialize the queryset and return.
        serializer = InvalidFrameTrackingSerializer(invalid_frame_trackings, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        pass

class FilterRecordingTrackingView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):

        # 1. Extract parameters from the URL. If not present, substitute the default values.
        input_date = request.GET.get('date') or str(datetime.datetime.date(datetime.datetime.now()))
        channel_values = request.GET.getlist('channel_values') or ChannelInfo.objects.values_list('channel_value', flat=True)
        
        # 2. initialize the result with entire table.
        filter_recording_trackings = FilterRecordingTracking.objects.all()
        
        # 3. filtering the result using GET parameters.
        try:
            # A. PRE-PROCESSING GET PARAMETERS TO GET FILTER VALUES.

            # i. get date in yyyymmdd format
            yyyymmdd_date = "".join(input_date.split("-"))
            
            # ii. Convert the list_of_strings of channel_values to list_of_integers.
            channel_values_int = [int(x) for x in channel_values]
            
            # B. APPLYING FILTERS

            # i. Filter entries whose request_id starts with the yyyymmdd date string obtained above 
            # and have channel_value as any one in the channel_values_int list.
            filter_recording_trackings = filter_recording_trackings.filter(request_id__startswith = yyyymmdd_date, channel_value__in = channel_values_int)
        
        # Incase, if any exception occurs while any of the above processing steps, return an empty queryset.
        except ValueError as error:
            filter_recording_trackings = FilterRecordingTracking.objects.none()
        
        # 4. serialize and return
        serializer = FilterRecordingTrackingSerializer(filter_recording_trackings, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        pass

class RecordingTrackingView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        
        # 1. Extract parameters from the URL. If not present, substitute the default values.
        request_id = request.GET.get('request_id')
        device_id = request.GET.get('device_id') or 'all'

        # 2. initialize the result with entire table.
        recording_tracking = RecordingTracking.objects.all()

        # 3. Apply the filters to get filtered data.
        recording_tracking = RecordingTracking.objects.filter(request_id = request_id, device_id = device_id)
        
        # 3. Serialize and return
        serializer = RecordingTrackingSerializer(recording_tracking, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        pass

class GraphUIRedirectView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        
        # 1. Extract parameters from the URL. If not present, substitute the default values.
        request_id = request.GET.get('request_id')
        device_id = request.GET.get('device_id')

        # 2. Apply the filters to get filtered data.
        recordings = Recording.objects.filter(request_id = request_id, device_id = device_id)
        
        # 3. Serialize and return
        serializer = RecordingSerializer(recordings, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        pass

class RecordingGuideView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):

        # get the input params
        input_date = request.GET.get('date') or str(datetime.datetime.date(datetime.datetime.now()))
        channel_values = request.GET.getlist('channel_values') or ChannelInfo.objects.values_list('channel_value', flat=True)
        device_id = request.GET.get('device_id') or 'a'
        
        utc_timezone = pytz.timezone('UTC')
        
        recording_guides = RecordingGuide.objects.all()

        try:
            channel_values_int = [int(x) for x in channel_values]
            input_datetime_object = utc_timezone.localize(datetime.datetime.strptime(input_date, "%Y-%m-%d"))
            weekday = calendar.day_name[input_datetime_object.weekday()].lower()


            recording_guides = recording_guides.filter(
                                                        channel_value__in = channel_values_int, 
                                                        validity_start__lte = input_datetime_object,
                                                        validity_end__gte = input_datetime_object,
                                                        **{weekday: True}
                                                    )
            if device_id != 'all':
                recording_guides = recording_guides.filter(device_id = device_id)

        except ValueError as error:
            recording_guides = RecordingGuide.objects.none()

        serializer = RecordingGuideSerializer(recording_guides, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        pass
