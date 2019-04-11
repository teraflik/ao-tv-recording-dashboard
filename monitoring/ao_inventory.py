"""
.. module:: dashboard.monitoring
   :platform: Linux (Ubuntu)
   :synopsis: Methods specific to AthenasOwl use cases, building on top of
        :class:`InventoryManager` and extended to include management of OBS.

.. moduleauthor:: Raghav Khandelwal <raghav.khandelwal@quantiphi.com>

"""
# -*- coding: utf-8 -*-
__author__ = "Raghav Khandelwal"
__copyright__ = "Copyright (©) 2019. Athenas Owl. All rights reserved."
__credits__ = ["Quantiphi Analytics"]

import logging

import obswebsocket
import obswebsocket.requests
import socket

from .inventory import InventoryManager

logging.basicConfig(level=logging.WARNING, filename="/tmp/monitoring.log", filemode='a', format='%(asctime)s | %(levelname)s | %(message)s', datefmt='%Y-%m-%d %H:%M:%S')

class OBSWebsocket():
    """
    Class to manage OBS on a remote host using OBS Websocket.
    
    Uses obs-websocket-py library, that works on top of obs-websocket protocol.
    Refer: https://github.com/Palakis/obs-websocket/blob/4.x-current/docs/generated/protocol.md

    Initializing an object of this class establishes connection to obs-websocket on the specified
    host or raises `ConnectionError` on failure.
    """  
    log = logging.getLogger(__name__)

    def __init__(self, host, port=4444):
        try:
            self.client = obswebsocket.obsws(host, port)
            self.client.connect()
        except (socket.error, obswebsocket.exceptions.ConnectionFailure) as e:
            self.log.warning("Failed to connect to OBS Websocket on %s:%s", host, port)
            raise ConnectionError("Failed to connect to OBS Websocket on {host}:{port}".format(host=host, port=port))

    def is_recording(self):
        """Get the current recording status of client.

        Returns:
            bool. The recording status::
                True -- Recording
                False -- Not Recording
        """
        recording = self.client.call(obswebsocket.requests.GetStreamingStatus())
        return recording.getRecording()
    
    def start_recording(self):
        """Start recording on client.

        Returns:
            bool or String. Command status::
                True -- Recording succesfully started.
                String -- Error due to which recording failed to start.
        """
        recording = self.client.call(obswebsocket.requests.StartRecording())
        return True if recording.status else recording.datain['error']
    
    def stop_recording(self):
        """Stop recording on client.

        Returns:
            bool or String. Command status::
                True -- Recording succesfully stopped.
                String -- Error due to which recording failed to stop.
        """
        recording = self.client.call(obswebsocket.requests.StopRecording())
        return True if recording.status else recording.datain['error']
    
    def reset_source(self):
        """Reset the recording sources on the client.

        Gets a list of all the sources in the active scene, and sets them again.

        Returns:
            bool. Command status::
                True -- Sources succesfully reset
                False -- Sources failed to reset
        """
        scene = self.client.call(obswebsocket.requests.GetCurrentScene())
        sources = scene.getSources()
        for source in sources:
            settings = self.client.call(obswebsocket.requests.GetSourceSettings(source["name"], source["type"])).getSourcesettings()
            self.client.call(obswebsocket.requests.SetSourceSettings(source["name"], settings, source["type"]))
        return True

class AOInventoryManager(InventoryManager):

    def get_cron(self, host, username, password):
        try:
            return self.run_command(host, username, password, "crontab -l | grep -v '#'") #Don't get commented lines
        except (ConnectionError, OSError) as e:
            return str(e)

    def get_uptime(self, host, username, password):
        try:
            return self.run_command(host, username, password, r"""awk '{printf("%02d:%02d", int($1/3600), int(($1%3600)/60))}' /proc/uptime""")
        except (ConnectionError, OSError) as e:
            return str(e)
    
    def get_channel_id(self, host, username, password):
        try:
            return self.get_file_contents(host, username, password, "/home/user/Desktop/TV/scripts/channel_value.txt")
        except (ConnectionError, OSError) as e:
            return str(e)

    # * Might need sudo :P
    def reboot(self, host, username, password):
        try:
            return self.run_command("reboot")
        except (ConnectionError, OSError) as e:
            return str(e)