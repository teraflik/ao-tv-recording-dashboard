from django.contrib import admin
from django.contrib.auth.models import User, Group

from .models import ChannelInfo, FilterRecordingTracking, InvalidFrameTracking, Recording, RecordingTracking

# Register your models here.
@admin.register(ChannelInfo)
class ChannelInfoAdmin(admin.ModelAdmin):
    list_display = [field.name for field in ChannelInfo._meta.get_fields() if field.name != 'recording' and field.name != 'recordingtracking']
    list_filter = ('parent_network', )
    class Media:
        js = ( 
                "rest_api/trial.js",
             )

@admin.register(Recording)
class RecordingAdmin(admin.ModelAdmin):
    list_display = [field.name for field in Recording._meta.get_fields()] 
    search_fields = ('request_id',)
    list_filter = ('device_id', 'channel_value')

@admin.register(RecordingTracking)
class RecordingTrackingAdmin(admin.ModelAdmin):
    list_display = [field.name for field in RecordingTracking._meta.get_fields()]
    search_fields = ('request_id',)
    list_filter = ('device_id', 'channel_value')

@admin.register(InvalidFrameTracking)
class InvalidFrameTrackingAdmin(admin.ModelAdmin):
    list_display = [field.name for field in InvalidFrameTracking._meta.get_fields()]

@admin.register(FilterRecordingTracking)
class FilterRecordingTrackingAdmin(admin.ModelAdmin):
    list_display = [field.name for field in FilterRecordingTracking._meta.get_fields()]


admin.site.site_header = "Athenas Owl"
admin.site.site_title = "Athenas Owl"
admin.site.index_title = "TV RECORDING DATABASE UI"

# admin.site.unregister(User)
# admin.site.unregister(Group)