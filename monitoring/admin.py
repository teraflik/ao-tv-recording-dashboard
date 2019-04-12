from django.contrib import admin

from .models import Node
# Register your models here.

class NodeAdmin(admin.ModelAdmin):
    list_display = ['label', 'ip_address', 'username', 'password', 'mac_address', 'screenshot', 'netdata_host']

admin.site.register(Node, NodeAdmin)