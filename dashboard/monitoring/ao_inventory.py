# -*- coding: utf-8 -*-
"""
Methods specific to AthenasOwl use cases, building on top of :class:`monitoring.inventory.InventoryManager` 
and extended to include management of OBS.
"""

import logging
import socket

import obswebsocket
import obswebsocket.requests

from .inventory import InventoryManager

logging.basicConfig(level=logging.WARNING, filename="/tmp/monitoring.log", filemode='a',
                    format='%(asctime)s | %(levelname)s | %(message)s', datefmt='%Y-%m-%d %H:%M:%S')


class OBSWebsocket():
    """
    Manages OBS on a remote host, using its OBS Websocket Plugin.

    Using methods provided by the `obs-websocket-py` library, requests can be initiated to
    a :class:`monitoring.models.Node` instance (or any remote machine) running OBS with obs-websocket.
    
    References:
        OBS Websocket Protocol: https://github.com/Palakis/obs-websocket/blob/4.x-current/docs/generated/protocol.md

    Initializing an object of this class establishes connection to obs-websocket on the specified
    host or raises `ConnectionError` on failure.
    """
    log = logging.getLogger(__name__)

    def __init__(self, host, port=4444):
        try:
            self.client = obswebsocket.obsws(host, port)
            self.client.connect()
        except (socket.error, obswebsocket.exceptions.ConnectionFailure) as e:
            self.log.warning(
                "Failed to connect to OBS Websocket on %s:%s", host, port)
            raise ConnectionError(
                "Failed to connect to OBS Websocket on {host}:{port}".format(host=host, port=port))

    def is_recording(self):
        """
        Get the current recording status of OBS.

        Returns:
            bool: The recording status. :obj:`True` if Recording, :obj:`False` if Not Recording.
        """
        recording = self.client.call(
            obswebsocket.requests.GetStreamingStatus())
        return recording.getRecording()

    def start_recording(self):
        """
        Start recording on OBS.

        Returns:
            bool or String: Command status, :obj:`Bool(True)` if recording succesfully started 
            or :obj:`String(Error)` due to which recording failed to start.
        """
        
        recording = self.client.call(obswebsocket.requests.StartRecording())
        return True if recording.status else recording.datain['error']

    def stop_recording(self):
        """
        Stop recording on OBS.

        Returns:
            bool or String: Command status, :obj:`Bool(True)` if recording succesfully stopped 
            or :obj:`String(Error)` due to which recording failed to stop.
        """
        
        recording = self.client.call(obswebsocket.requests.StopRecording())
        return True if recording.status else recording.datain['error']

    def reset_source(self):
        """
        Reset the recording sources on the OBS.

        Fetches a list of all the active sources in the current scene, and applies them again.

        Returns:
            bool: Command status, :obj:`True` when sources succesfully reset.
        """
        scene = self.client.call(obswebsocket.requests.GetCurrentScene())
        sources = scene.getSources()
        for source in sources:
            settings = self.client.call(obswebsocket.requests.GetSourceSettings(
                source["name"], source["type"])).getSourcesettings()
            self.client.call(obswebsocket.requests.SetSourceSettings(
                source["name"], settings, source["type"]))
        return True


class AOInventoryManager(InventoryManager):
    """
    Extends :class:`monitoring.inventory.InventoryManager` to provide methods specific to
    AthenasOwl TV Recording use cases.
    """

    def get_cron(self, host, username, password):
        """
        Gets a list of cron jobs currently in operation on the remote machine, by 
        checking the contents of **crontab**.

        Note:
            Commented lines are automatically ignored.
        
        Args:
            host (str): hostname or IP address.
            username (str): SSH user.
            password (str): SSH password.

        Returns:
            str: String containing the output of ``crontab -l`` without the commented 
            lines. In case of an error, returns the error message.
        """
        try:
            # Don't get commented lines
            return self.run_command(host, username, password, "crontab -l | grep -v '#'")
        except (ConnectionError, OSError) as e:
            return str(e)

    def get_uptime(self, host, username, password):
        """
        Gets the uptime (time since last boot) of the remote machine, by checking 
        the contents of ``/proc/uptime``.

        Args:
            host (str): hostname or IP address.
            username (str): SSH user.
            password (str): SSH password.

        Returns:
            str: The uptime of the machine in **HH:MM** format. Incase of an error, 
            returns the error message.
        """
        try:
            return self.run_command(host, username, password,
                r"""awk '{printf("%02d:%02d", int($1/3600), int(($1%3600)/60))}' /proc/uptime""")
        except (ConnectionError, OSError) as e:
            return str(e)

    def get_channel_id(self, host, username, password):
        """
        Gets the ``channel_id`` currently set on the remote machine from the designated file.

        Args:
            host (str): hostname or IP address.
            username (str): SSH user.
            password (str): SSH password.

        Returns:
            str: A string containing the contents of the ``/home/user/Desktop/TV/scripts/channel_value.txt``
            file. In case of an error, returns the error message.
        """
        try:
            return self.get_file_contents(host, username, password, "/home/user/Desktop/TV/scripts/channel_value.txt")
        except (ConnectionError, OSError) as e:
            return str(e)

    # * Might need sudo. Not tested
    def reboot(self, host, username, password):
        try:
            return self.run_command("reboot")
        except (ConnectionError, OSError) as e:
            return str(e)
