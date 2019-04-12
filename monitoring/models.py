from django.db import models
from django.core.files.base import ContentFile

# Create your models here.

class Node(models.Model):
    """
    Store information and credentials of a Node.

    A Node is any remote machine on the same network as the server (running this web application).
    
    In order to allow retrieval of information from the node, its SSH credentials
    are required. Other health monitoring data (like CPU and RAM usage) is collected from
    the Netdata service, which can be installed on the Node and runs on port 19999 by default.

    Attributes:
        label (str, optional): A label set by the user to identify the :class:`Node` instance.
        ip_address: The IP address/host of the Node.
        username: SSH user.
        password: SSH password.
        mac_address: (Optional) HWaddress. Can be used to verify the identity of 
            the Node incase IP address changes and issue a warning.
        screenshot: Screenshot last grabbed from the Node.
        netdata_host: The Netdata API endpoint for the Node. This is used by the
            front-end Netdata Vue.JS components. Default is `http://ip_address:19999/`.

    Note:
        The MAC Address verification has not been implemented.
    """

    label = models.CharField(max_length=200, blank=True)
    ip_address = models.GenericIPAddressField(verbose_name="IP Address", blank=False)
    username = models.CharField(verbose_name="SSH Username", max_length=50, default="user", blank=False)
    password = models.CharField(verbose_name="SSH Password", max_length=100, default="12345", blank=False)
    mac_address = models.CharField(max_length=20, verbose_name="MAC Address", blank=True)
    screenshot = models.ImageField(verbose_name="Last Screenshot", upload_to='screenshots', blank=True)
    netdata_host = models.CharField(max_length=50, verbose_name="Netdata Host", blank=False, unique=True)

    def __str__(self):
        """Provide a string representation to the object."""
        
        return self.label
    
    def update_screenshot(self, image):
        """
        Updates the screenshot for the node, with the provided image.

        The image is saved to ``MEDIA_ROOT```/media/screenshots/` directory
        Args:
            image (str): JPG/PNG Image as a byte string. Usually derived from `file.read()`
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