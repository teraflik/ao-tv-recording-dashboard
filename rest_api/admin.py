# -*- coding: utf-8 -*-
__author__ = "Asutosh Sahoo"
__copyright__ = "Copyright (©) 2019. Athenas Owl. All rights reserved."
__credits__ = ["Quantiphi Analytics"]

# Django related dependencies
from django.contrib import admin
from django.contrib.auth.models import Group, User
from django.db import models

# Project related dependencies
from .models import (ChannelInfo, FilterRecordingTracking,
                     InvalidFrameTracking, Recording, RecordingTracking)


# Register your models here.
@admin.register(ChannelInfo)
class ChannelInfoAdmin(admin.ModelAdmin):
    list_display = [field.name for field in ChannelInfo._meta.fields]
    list_filter = ('parent_network', )


@admin.register(Recording)
class RecordingAdmin(admin.ModelAdmin):
    # for channel_value attribute, replace with get_channel_name
    list_display = list(map(lambda x: 'get_channel_name' if x == 'channel_value' else x, 
                            (field.name for field in Recording._meta.fields)))
    
    search_fields = ('request_id',)
    list_filter = ('device_id', 'channel_value')

    def get_channel_name(self, obj):
        return obj.channel_value.channel_name
    
    get_channel_name.short_description = 'Channel Name'
    get_channel_name.admin_order_field = 'channel_value__channel_name'


@admin.register(RecordingTracking)
class RecordingTrackingAdmin(admin.ModelAdmin):
    # for channel_value attribute, replace with get_channel_name
    list_display = list(map(lambda x: 'get_channel_name' if x == 'channel_value' else x, 
                            (field.name for field in RecordingTracking._meta.fields)))
    
    search_fields = ('request_id',)
    list_filter = ('device_id', 'channel_value')

    def get_channel_name(self, obj):
        return obj.channel_value.channel_name
    
    get_channel_name.short_description = 'Channel Name'
    get_channel_name.admin_order_field = 'channel_value__channel_name'


@admin.register(InvalidFrameTracking)
class InvalidFrameTrackingAdmin(admin.ModelAdmin):
    list_display = [field.name for field in InvalidFrameTracking._meta.fields]
    search_fields = ('request_id',)


@admin.register(FilterRecordingTracking)
class FilterRecordingTrackingAdmin(admin.ModelAdmin):
    list_display = [field.name for field in FilterRecordingTracking._meta.fields]
    search_fields = ('request_id',)


admin.site.site_header = "Athenas Owl"
admin.site.site_title = "Athenas Owl"
admin.site.index_title = "TV RECORDING DATABASE UI"

# admin.site.unregister(User)
# admin.site.unregister(Group)
