from rest_framework import serializers

from .models import Channel, Schedule


class ChannelSerializer(serializers.ModelSerializer):
    schedules = serializers.StringRelatedField(many=True)

    class Meta:
        model = Channel
        fields = ('value', 'name', 'logo', 'schedules')


class ScheduleSerializer(serializers.HyperlinkedModelSerializer):
    devices = serializers.ReadOnlyField(source='get_nodes')
    channel_name = serializers.CharField(source='channel.name')
    
    class Meta:
        model = Schedule
        fields = ('channel_name','channel', 'rec_start', 'rec_stop', 'monday', 'tuesday',
                  'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'devices')
        extra_kwargs = {
            'channel': {'view_name': 'schedule_api:channel-detail'},
        }