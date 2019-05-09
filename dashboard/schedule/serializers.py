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

class NodeAllocationSerializer(serializers.HyperlinkedModelSerializer):
    channel_name = serializers.StringRelatedField(source='schedule.channel')
    rec_start = serializers.ReadOnlyField(source='schedule.rec_start')
    rec_stop = serializers.ReadOnlyField(source='schedule.rec_stop')

    class Meta:
        model = NodeAllocation
        fields = ('id', 'channel_name', 'rec_start', 'rec_stop')

class NodeSerializer(serializers.ModelSerializer):
    schedules = NodeAllocationSerializer(source='nodeallocation_set', many=True)

    class Meta:
        model = Node
        fields = ('id','schedules')
