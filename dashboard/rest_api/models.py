# -*- coding: utf-8 -*-
from __future__ import unicode_literals
__author__ = "Asutosh Sahoo"
__copyright__ = "Copyright (©) 2019. Athenas Owl. All rights reserved."
__credits__ = ["Quantiphi Analytics"]

# python dependencies
import datetime
import pytz

# django dependencies
from django.db import models
from monitoring.models import Node


class ChannelInfo(models.Model):
    channel_value = models.IntegerField(blank=True, primary_key=True)
    channel_name = models.CharField(max_length=255, blank=True, null=True)
    parent_network = models.CharField(max_length=255, blank=True, null=True)
    market = models.CharField(max_length=255, blank=True, null=True)
    channel_id = models.CharField(max_length=255, blank=True, null=True)
    logo_url = models.CharField(max_length=2000, blank=True, null=True)

    def __str__(self):
        return self.channel_name

    class Meta:
        managed = False
        db_table = 'channel_info'


class FilterRecordingTracking(models.Model):
    device_id = models.CharField(max_length=255, blank=True, null=True)
    request_id = models.CharField(max_length=255, blank=True, primary_key=True)
    channel_value = models.IntegerField(blank=True, null=True)
    clip_path = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=255, blank=True, null=True)
    start_timestamp = models.DateTimeField(blank=True, null=True)
    end_timestamp = models.DateTimeField(blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)
    clip_slot = models.CharField(max_length=255, blank=True, null=True)
    clip_number = models.IntegerField(blank=True, null=True)
    clip_size = models.FloatField(blank=True, null=True)
    clip_duration = models.FloatField(blank=True, null=True)
    prediction_status = models.IntegerField(blank=True, null=True)
    blank_flag = models.IntegerField(blank=True, null=True)
    corrupt_flag = models.IntegerField(blank=True, null=True)
    character_status = models.IntegerField(blank=True, null=True)
    toprocess = models.IntegerField(db_column='toProcess', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'filter_recording_tracking'


class InvalidFrameTracking(models.Model):
    device_id = models.CharField(max_length=255, blank=True, null=True)
    request_id = models.CharField(max_length=255, blank=True, primary_key=True)
    invalid_frame_from = models.CharField(max_length=255, blank=True, null=True)
    invalid_frame_to = models.CharField(max_length=255, blank=True, null=True)
    migration_status = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'invalid_frame_tracking'


class Recording(models.Model):
    device_id = models.CharField(max_length=255, blank=True, null=True)
    request_id = models.CharField(max_length=255, blank=True, primary_key=True)
    channel_value = models.ForeignKey(ChannelInfo, models.DO_NOTHING, db_column='channel_value', blank=True, null=True)
    stage_number = models.FloatField(blank=True, null=True)
    stage_message = models.CharField(max_length=255, blank=True, null=True)
    timestamp = models.DateTimeField(blank=True, null=True)
    video_path = models.TextField(blank=True, null=True)
    clip_number = models.IntegerField(blank=True, null=True)
    clip_slot = models.CharField(max_length=255, blank=True, null=True)
    migration_status = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'recording'


class RecordingTracking(models.Model):
    device_id = models.CharField(max_length=255, blank=True, null=True)
    request_id = models.CharField(max_length=255, blank=True, primary_key=True)
    channel_value = models.ForeignKey(ChannelInfo, models.DO_NOTHING, db_column='channel_value', blank=True, null=True)
    clip_path = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=255, blank=True, null=True)
    start_timestamp = models.DateTimeField(blank=True, null=True)
    end_timestamp = models.DateTimeField(blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)
    clip_slot = models.CharField(max_length=255, blank=True, null=True)
    clip_number = models.IntegerField(blank=True, null=True)
    clip_size = models.FloatField(blank=True, null=True)
    clip_duration = models.FloatField(blank=True, null=True)
    migration_status = models.IntegerField(blank=True, null=True)
    prediction_status = models.IntegerField(blank=True, null=True)
    blank_flag = models.IntegerField(blank=True, null=True)
    corrupt_flag = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'recording_tracking'

class RecordingGuide(models.Model):
    channel_value = models.ForeignKey(ChannelInfo, models.DO_NOTHING, db_column='channel_value', blank=False)
    device_id = models.CharField(blank=False, max_length=255)
    start_time = models.TimeField(blank=False)
    stop_time = models.TimeField(blank=False)
    validity_start = models.DateField(blank=False, default=datetime.date.today)
    validity_end = models.DateField(blank=False, default=datetime.date.max)
    monday = models.BooleanField(blank=False, default=True)
    tuesday = models.BooleanField(blank=False, default=True)
    wednesday = models.BooleanField(blank=False, default=True)
    thursday = models.BooleanField(blank=False, default=True)
    friday = models.BooleanField(blank=False, default=True)
    saturday = models.BooleanField(blank=False, default=True)
    sunday = models.BooleanField(blank=False, default=True)
    node = models.ForeignKey(Node, null=True, on_delete=models.SET_NULL)

    class Meta:
        managed = False
        db_table = 'recording_guide'

