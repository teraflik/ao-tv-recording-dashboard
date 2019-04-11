from django.db import models
from django.core.files.base import ContentFile

# Create your models here.

class Node(models.Model):
    """
    A Node is a computer system accessible by the server, running this application on its network.
    
    In order to allow retrieval of information from the node, its SSH credentials 
    are required. Other health monitoring data (like CPU and RAM usage) is collected from 
    the Netdata service running on the Node, that exposes its API on port 19999 by default.

    Attributes:
        label: (Optional) A personal label set by user to identify the node
        ip_address: The IP address/host of the remote machine
        username: SSH user of the remote machine
        password: SSH password of the remote machine
        mac_address: (Optional) HWaddress. Can be used to verify the identity of 
            the machine incase IP address changes. [Yet to be implemented]
        screenshot: Screenshot last grabbed from the remote machine
        netdata_host: The Netdata API endpoint for the host, which is consumed by the 
            Netdata Vue.JS components.
    """
    label = models.CharField(max_length=200, blank=True)
    ip_address = models.GenericIPAddressField(verbose_name="IP Address", blank=False)
    username = models.CharField(verbose_name="SSH Username", max_length=50, default="user", blank=False)
    password = models.CharField(verbose_name="SSH Password", max_length=100, default="12345", blank=False)
    mac_address = models.CharField(max_length=20, verbose_name="MAC Address", blank=True)
    screenshot = models.ImageField(verbose_name="Last Screenshot", upload_to='screenshots', blank=True)
    netdata_host = models.CharField(max_length=50, verbose_name="Netdata Host", blank=False, unique=True)

    def __str__(self):
        return self.ip_address
    
    def update_screenshot(self, image):
        """
        Updates the screenshot for the node, with the provided image file.

        Args:
            image: JPG/PNG Image as a binary file object.
        """
        image_name = "{:s}.jpg".format(self.label)
        self.screenshot.save(image_name, ContentFile(image), save=True)
    
    @property
    def screenshot_url(self):
        """
        Gets the screenshot URL.

        Returns:
            A string containing the URL of the last stored screenshot.
        """
        if self.screenshot and hasattr(self.screenshot, 'url'):
            return self.screenshot.url