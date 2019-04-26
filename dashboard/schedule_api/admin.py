from django.contrib import admin

from .models import Schedule, Channel, NodeAllocation

@admin.register(Channel)
class ChannelAdmin(admin.ModelAdmin):
    list_display = ['name', 'value', 'logo']

@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ['channel', 'rec_start', 'rec_stop', 'monday', 'tuesday', 
        'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'devices']
    
    def devices(self, obj):
        return obj.get_nodes()

@admin.register(NodeAllocation)
class NodeAllocationAdmin(admin.ModelAdmin):
    list_display = ['label', 'schedule', 'node']