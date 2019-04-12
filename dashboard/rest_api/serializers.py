# -*- coding: utf-8 -*-
__author__ = "Asutosh Sahoo"
__copyright__ = "Copyright (©) 2019. Athenas Owl. All rights reserved."
__credits__ = ["Quantiphi Analytics"]

# djangorestframework dependencies
from rest_framework import serializers

# project dependencies
from .models import (ChannelInfo, FilterRecordingTracking,
                     InvalidFrameTracking, Recording, RecordingTracking)


class ChannelInfoSerializer(serializers.ModelSerializer):

    class Meta:
        model = ChannelInfo
        fields = '__all__'

class FilterRecordingTrackingSerializer(serializers.ModelSerializer):

    class Meta:
        model = FilterRecordingTracking
        fields = '__all__'

class InvalidFrameTrackingSerializer(serializers.ModelSerializer):

    class Meta:
        model = InvalidFrameTracking
        fields = ('device_id', 'request_id', 'invalid_frame_from', 'invalid_frame_to')  # skipped migration_status

class RecordingSerializer(serializers.ModelSerializer):
    channel_name = serializers.ReadOnlyField(source='channel_value.channel_name')

    class Meta:
        model = Recording
        fields = ('request_id', 'device_id', 'timestamp', 'channel_name', 'stage_message', 'stage_number', 'video_path')
        # depth = 1

class RecordingTrackingSerializer(serializers.ModelSerializer):

    class Meta:
        model = RecordingTracking
        fields = '__all__'
