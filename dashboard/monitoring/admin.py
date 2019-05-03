from django.contrib import admin

from .models import CaptureCard, Node, System, VideoSource


class SystemAdmin(admin.ModelAdmin):
    """
    Configure the admin dashboard for :py:class:`models.System` model.
    """
    list_display = ['__str__', 'ip_address', 'os', 'username',
                    'password', 'mac_address', 'screenshot', 'netdata_host']

class CaptureCardAdmin(admin.ModelAdmin):
    """
    Configure the admin dashboard for :py:class:`models.CaptureCard` model.
    """
    list_display = ['__str__', 'manufacturer', 'model', 'identifier']

class VideoSourceAdmin(admin.ModelAdmin):
    """
    Configure the admin dashboard for :py:class:`models.VideoSource` model.
    """
    list_display = ['__str__', 'source_type', 'manufacturer', 'model', 'identifier', 'comments']

class NodeAdmin(admin.ModelAdmin):
    """
    Configure the admin dashboard for :py:class:`models.Node` model.
    """
    list_display = ['__str__', 'system', 'capture_card', 'video_source']

admin.site.register(CaptureCard, CaptureCardAdmin)
admin.site.register(VideoSource, VideoSourceAdmin)
admin.site.register(System, SystemAdmin)
admin.site.register(Node, NodeAdmin)
