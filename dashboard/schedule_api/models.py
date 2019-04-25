from django.db import models
import datetime

from monitoring.models import Node

class Channel(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    channel_id = models.CharField(max_length=255, blank=True, null=True)
    logo_url = models.CharField(max_length=2000, blank=True, null=True)

    def __str__(self):
        return self.name

class Schedule(models.Model):
    channel_value = models.ForeignKey(Channel, on_delete=models.PROTECT, blank=False)
    device = models.CharField(blank=False, max_length=255)
    start_time = models.TimeField(blank=False)
    stop_time = models.TimeField(blank=False)
    validity_start = models.DateField(blank=False, default=datetime.date.today)
    validity_end = models.DateField(blank=False, default=datetime.date.max)
    monday = models.BooleanField(blank=False, default=True)
    tuesday = models.BooleanField(blank=False, default=True)
    wednesday = models.BooleanField(blank=False, default=True)
    thursday = models.BooleanField(blank=False, default=True)
    friday = models.BooleanField(blank=False, default=True)
    saturday = models.BooleanField(blank=False, default=True)
    sunday = models.BooleanField(blank=False, default=True)
    node = models.ForeignKey(Node, null=True, on_delete=models.SET_NULL)