from django.contrib import admin

from .models import Node


class NodeAdmin(admin.ModelAdmin):
    """
    Configure the admin dashboard for `Node` model.
    """
    list_display = ['label', 'ip_address', 'username',
                    'password', 'mac_address', 'screenshot', 'netdata_host']


admin.site.register(Node, NodeAdmin)
