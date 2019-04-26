from django.db import models
import datetime

from monitoring.models import Node

class Channel(models.Model):
    name = models.CharField(verbose_name="Channel Name", max_length=255, blank=False)
    value = models.SmallIntegerField(verbose_name="Channel Value", unique=True, blank=False)
    logo = models.ImageField(
        verbose_name="Channel Logo", upload_to="channel_logo", blank=True)

    def __str__(self):
        return self.name

class Schedule(models.Model):
    channel = models.ForeignKey(Channel, verbose_name="Channel Name", on_delete=models.PROTECT, blank=False)
    rec_start = models.TimeField(verbose_name="Recording Start Time", blank=False)
    rec_stop = models.TimeField(verbose_name="Recording Stop Time", blank=False)
    monday = models.BooleanField(blank=False, default=True)
    tuesday = models.BooleanField(blank=False, default=True)
    wednesday = models.BooleanField(blank=False, default=True)
    thursday = models.BooleanField(blank=False, default=True)
    friday = models.BooleanField(blank=False, default=True)
    saturday = models.BooleanField(blank=False, default=True)
    sunday = models.BooleanField(blank=False, default=True)
    nodes = models.ManyToManyField(Node,through="NodeAllocation")

    def __str__(self):
        return "{0} [{1} - {2}]".format(self.channel, self.rec_start, self.rec_stop)
    
    def get_nodes(self):
        devices = ""
        for node in self.nodeallocation_set.all():
            device = [i[1] for i in NodeAllocation.LABEL_CHOICES if i[0] == node.label]
            devices = devices + ", Device: " + str(device)

        return devices
        #return ", ".join([self.nodeallocation_set.get(node=node) node.__str__() ])

class NodeAllocation(models.Model):

    # TODO: Make all 3 unique together
    LABEL_CHOICES = [
        (0, "A"),
        (1, "B"),
    ]
    label = models.PositiveSmallIntegerField(verbose_name="Device ID", choices=LABEL_CHOICES, default=0, blank=False)
    schedule = models.ForeignKey(Schedule, verbose_name="Schedule", on_delete=models.CASCADE, blank=False)
    node = models.ForeignKey(Node, verbose_name="Node", on_delete=models.CASCADE, blank=False)