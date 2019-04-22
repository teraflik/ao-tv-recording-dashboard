from django.db import models
from django.core.files.base import ContentFile


class VideoSource(models.Model):
    TYPE_STB = "Set Top Box"
    TYPE_WEB = "Web Player"
    TYPE_OTH = "Other"

    TYPE_CHOICES = [
        (TYPE_STB, "Set Top Box"),
        (TYPE_WEB, "Web Player"),
        (TYPE_OTH, "Other"),
    ]

    source_type = models.CharField(
        verbose_name="Type", max_length=200, choices=TYPE_CHOICES, default=TYPE_STB)
    manufacturer = models.CharField(
        verbose_name="Manufacturer", max_length=200, blank=True)
    model = models.CharField(verbose_name="Model", max_length=200, blank=True)
    identifier = models.CharField(
        verbose_name="Unique Identifier", max_length=200, blank=True)

    def __str__(self):
        """Provide a string representation to the object."""
        if self.manufacturer:
            return "{0} - {1}".format(self.manufacturer, self.model) if self.model else self.manufacturer
        else:
            return "Video Source {0}".format(self.pk)

class CaptureCard(models.Model):
    manufacturer = models.CharField(
        verbose_name="Manufacturer", max_length=200, blank=True)
    model = models.CharField(verbose_name="Model", max_length=200, blank=True)
    identifier = models.CharField(
        verbose_name="Unique Identifier", max_length=200, blank=True)

    def __str__(self):
        """Provide a string representation to the object."""
        if self.manufacturer:
            return "{0} - {1}".format(self.manufacturer, self.model) if self.model else self.manufacturer
        else:
            return "Video Source {0}".format(self.pk)
        

class System(models.Model):
    """
    Store information and credentials of a System.

    A System is any remote machine on the same network as the server (running this web application).

    In order to allow retrieval of information from the System, its SSH credentials
    are required. Other health monitoring data (like CPU and RAM usage) is collected from
    the Netdata service, which can be installed on the System and runs on port 19999 by default.

    Attributes:
        label (str, optional): A label set by the user to identify the :class:`System` instance.
        ip_address: The IP address/host of the System.
        username: SSH user.
        password: SSH password.
        mac_address: (Optional) HWaddress. Can be used to verify the identity of 
            the System incase IP address changes and issue a warning.
        screenshot: Screenshot last grabbed from the System.
        netdata_host: The Netdata API endpoint for the System. This is used by the
            front-end Netdata Vue.JS components. Default is `http://ip_address:19999/`.

    Note:
        The MAC Address verification has not been implemented.
    """
    ip_address = models.GenericIPAddressField(
        verbose_name="IP Address", blank=False)
    username = models.CharField(
        verbose_name="SSH Username", max_length=200, default="user", blank=False)
    password = models.CharField(
        verbose_name="SSH Password", max_length=200, default="12345", blank=False)
    mac_address = models.CharField(
        verbose_name="MAC Address", max_length=20, blank=True)
    screenshot = models.ImageField(
        verbose_name="Last Screenshot", upload_to='screenshots', blank=True)
    netdata_host = models.CharField(
        verbose_name="Netdata Host", max_length=200, blank=True)
    
    def __str__(self):
        """Provide a string representation to the object."""

        return str(self.ip_address)

    def update_screenshot(self, image):
        """
        Updates the screenshot for the System, with the provided image.

        The image is saved to ``MEDIA_ROOT```/media/screenshots/` directory

        Args:
            image (str): JPG/PNG Image as a byte string. Usually derived from `file.read()`
        """

        image_name = "screenshot.jpg"
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

class Node(models.Model):
    """
    Node Model.
    """
    
    system = models.ForeignKey(System, on_delete=models.SET_NULL, blank=True, null=True)
    capture_card = models.ForeignKey(CaptureCard, on_delete=models.SET_NULL, blank=True, null=True)
    video_source = models.ForeignKey(VideoSource, on_delete=models.SET_NULL, blank=True, null=True)

    def get_label(self):
        return "label"

    def __str__(self):
        """Provide a string representation to the object."""
        return str(self.system) + " | " + str(self.video_source)