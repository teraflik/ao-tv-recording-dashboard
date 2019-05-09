import datetime

from django.db import models

from monitoring.models import Node


class Channel(models.Model):
    name = models.CharField(verbose_name="Channel Name",
                            max_length=255, blank=False)
    value = models.SmallIntegerField(
        verbose_name="Channel Value", unique=True, blank=False)
    logo = models.ImageField(
        verbose_name="Channel Logo", upload_to="channel_logo", blank=True)
    
    class Meta:
        ordering = ('value',)

    def __str__(self):
        return self.name


class Schedule(models.Model):
    channel = models.ForeignKey(Channel, verbose_name="Channel Name", 
        on_delete=models.PROTECT, related_name="schedules", blank=False)
    rec_start = models.TimeField(verbose_name="Recording Start Time", blank=False)
    rec_stop = models.TimeField(verbose_name="Recording Stop Time", blank=False)
    monday = models.BooleanField(blank=False, default=True)
    tuesday = models.BooleanField(blank=False, default=True)
    wednesday = models.BooleanField(blank=False, default=True)
    thursday = models.BooleanField(blank=False, default=True)
    friday = models.BooleanField(blank=False, default=True)
    saturday = models.BooleanField(blank=False, default=True)
    sunday = models.BooleanField(blank=False, default=True)
    nodes = models.ManyToManyField(Node, through="NodeAllocation", related_name="schedules")

    def __str__(self):
        return "{0} [{1} - {2}]".format(self.channel, self.rec_start, self.rec_stop)

    def get_nodes(self):
        return ", ".join([ node.label for node in self.nodeallocation_set.all() ])

# TODO: Make all 3 unique together
class NodeAllocation(models.Model):
    LABEL_CHOICES = [
        ("A", "A"),
        ("B", "B"),
        ("C", "C"),
    ]
    label = models.CharField(verbose_name="Device ID", max_length=1,
                            choices=LABEL_CHOICES, default="A", blank=False)
    schedule = models.ForeignKey(Schedule, verbose_name="Schedule",
                            on_delete=models.CASCADE, blank=False)
    node = models.ForeignKey(Node, verbose_name="Node",
                            on_delete=models.CASCADE, blank=False)
