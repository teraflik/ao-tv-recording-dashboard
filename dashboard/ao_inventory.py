import logging

import obswebsocket
import obswebsocket.requests
import socket

from .inventory import InventoryManager

logging.basicConfig(level=logging.WARNING, filename="dashboard.log", filemode='a', format='%(asctime)s | %(levelname)s | %(message)s', datefmt='%Y-%m-%d %H:%M:%S')

class OBSWebsocket():
    """Manages OBS"""  
    log = logging.getLogger(__name__)

    def __init__(self, host, port=4444):
        try:
            self.client = obswebsocket.obsws(host, port)
            self.client.connect()
            # version = self.client.call(obswebsocket.requests.GetVersion()).getObsWebsocketVersion()
            # self.log.info("Connected to OBS Websocket version: %s on %s:%s", version, host, port)
        except (socket.error, obswebsocket.exceptions.ConnectionFailure) as e:
            self.log.warning("Failed to connect to OBS Websocket on %s:%s", host, port)
            raise ConnectionError("Failed to connect to OBS Websocket on {host}:{port}".format(host=host, port=port))

    def recording_status(self):
        recording = self.client.call(obswebsocket.requests.GetStreamingStatus())
        return recording.getRecording()
    
    def start_recording(self):
        recording = self.client.call(obswebsocket.requests.StartRecording())
        return True if recording.status else recording.datain['error']
    
    def stop_recording(self):
        recording = self.client.call(obswebsocket.requests.StopRecording())
        return True if recording.status else recording.datain['error']
    
    def refresh_source(self):
        scene = self.client.call(obswebsocket.requests.GetCurrentScene())
        sources = scene.getSources()
        for source in sources:
            settings = self.client.call(obswebsocket.requests.GetSourceSettings(source["name"], source["type"])).getSourcesettings()
            self.client.call(obswebsocket.requests.SetSourceSettings(source["name"], settings, source["type"]))
            return settings
        #return True

class AOInventoryManager(InventoryManager):
    def get_cron(self, host, username, password):
        try:
            return self.run_command(host, username, password, "crontab -l")
        except (ConnectionError, OSError) as e:
            return str(e)

    def get_uptime(self, host, username, password):
        try:
            return self.run_command(host, username, password, "uptime -p")
        except (ConnectionError, OSError) as e:
            return str(e)
    
    def get_channel_id(self, host, username, password):
        try:
            return self.get_file_contents(host, username, password, "/home/user/scripts/channel_value.txt")
        except (ConnectionError, OSError) as e:
            return str(e)

    # * Might need sudo :P
    def reboot(self, host, username, password):
        try:
            return self.run_command("reboot")
        except (ConnectionError, OSError) as e:
            return str(e)
    
    def obs_status(self, host, port=4444):
        try:
            obs = OBSWebsocket(host, port)
            obs_status = "Recording" if obs.recording_status() else "Not Recording"
        except ConnectionError:
            obs_status = "Not Running"
        return obs_status
