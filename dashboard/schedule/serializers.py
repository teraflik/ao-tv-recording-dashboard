from rest_framework import serializers

from .models import Channel, NodeAllocation, Schedule
from monitoring.models import Node


class ChannelSerializer(serializers.ModelSerializer):
    schedules = serializers.StringRelatedField(many=True)

    class Meta:
        model = Channel
        fields = ('value', 'name', 'logo', 'schedules')


class ScheduleSerializer(serializers.HyperlinkedModelSerializer):
    devices = serializers.ReadOnlyField(source='get_nodes')
    channel_name = serializers.CharField(source='channel')
    
    class Meta:
        model = Schedule
        fields = ('channel_name','channel', 'rec_start', 'rec_stop', 'monday', 'tuesday',
                  'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'devices')
        extra_kwargs = {
            'channel': {'view_name' : 'schedule:channel-detail'},
        }


class NodeSerializer(serializers.ModelSerializer):

    class Meta:
        model = Node
        fields = ('system','nodeallocation_set')