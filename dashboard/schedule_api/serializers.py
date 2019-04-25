from rest_framework import serializers

from .models import Channel, Schedule


class ChannelSerializer(serializers.ModelSerializer):

    class Meta:
        model = Channel
        fields = '__all__'

class ScheduleSerializer(serializers.ModelSerializer):

    class Meta:
        model = Schedule
        fields = '__all__'

