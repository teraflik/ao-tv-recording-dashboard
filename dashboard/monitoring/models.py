"""
Models for the monitoring app.

Capture Card (eg. BlackMagic Intensity Pro 4k), Video Source (eg. Hathway Set Top Box)
and a (Computer) System, clubbed together form a Node, that is responsible for TV Recording.
"""
from django.db import models
from django.core.files.base import ContentFile


class CaptureCard(models.Model):
    """
    A Capture Card, like a BlackMagic Device.

    Attributes:
        manufacturer (:py:class:`CharField`, Optional): Manufacturer of the Capture Card.
            eg. BlackMagic, WinTV, etc.
        model (:py:class:`CharField`, Optional): Model of the Video Source. eg. Intensity Pro 4K,
            (WinTV) QuadHD etc.
        identifier (:py:class:`CharField`, Optional): The serial number, or unique identifier
            of the Video Source.
    """
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


class VideoSource(models.Model):
    """
    A Video Source, like a Set Top Box or Netflix.

    Attributes:
        source_type (:py:class:`CharField`): Type of the source. Avaliable 
            options are *Set Top Box*, *Web Player*, and *Other*.
        manufacturer (:py:class:`CharField`, Optional): Manufacturer or provider of the source. 
            eg. Hathway, Airtel, Netflix, Hotstar, etc.
        model (:py:class:`CharField`, Optional): Model/category of the Video Source.
            eg. (Airtel) Digital TV HD, (Hotstar) Premium, etc.
        identifier (:py:class:`CharField`, Optional): The serial number, or unique identifier
            of the Video Source.
    """

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
        verbose_name="Manufacturer/Provider", max_length=200, blank=True)
    model = models.CharField(verbose_name="Model", max_length=200, blank=True)
    identifier = models.CharField(
        verbose_name="Unique Identifier", max_length=200, blank=True)
    comments = models.CharField(
        verbose_name="Comments", max_length=200, blank=True)

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
        ip_address (:py:class:`models.GenericIPAddressField`): The IP address/host of the System.
        os (:py:class:`models.PositiveSmallIntegerField`): Operating system type.
            Available choices are: Windows, Linux, or MacOS. Default is Linux.
        username (:py:class:`models.CharField`): SSH user.
        password (:py:class:`models.CharField`): SSH password. Will be stored in plain text.
        mac_address (:py:class:`models.CharField`, Optional): HWaddress. Can be used
            to verify the identity of the System incase IP address changes and issue a warning.
        screenshot (:py:class:`models.ImageField`): Screenshot last grabbed from the System.
        netdata_host (:py:class:`models.CharField`, Optional): The Netdata API endpoint for the System. This is used by the
            front-end Netdata Vue.JS components. Default is ``http://<ip_address>:19999/``.

    Note:
        The MAC Address verification has not been implemented.
    """

    OS_WINDOWS = 0
    OS_LINUX = 1
    OS_MACOS = 2

    OS_CHOICES = (
        (OS_WINDOWS, "Windows"),
        (OS_LINUX, "Linux"),
        (OS_MACOS, "Mac OS"),
    )
    ip_address = models.GenericIPAddressField(
        verbose_name="IP Address", blank=False)
    os = models.PositiveSmallIntegerField(
        verbose_name="Operating System", default=OS_LINUX, choices=OS_CHOICES, blank=False)
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

        The image is saved to ``MEDIA_ROOT`` i.e. ``/media/screenshots/`` directory.

        Args:
            image (str): JPG/PNG Image as a byte string. Usually derived from ``file.read()``
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
    Node is the complete setup responsible for generating content and uploading it.
    
    It consists of a :py:class:`CaptureCard`, a :py:class:`VideoSource`
    and a :py:class:`System`, working together to record, store and upload media,
    thus forming a pipeline of content generation.

    Attributes:
        capture_card (:py:class:`models.ForeignKey`): Foreign key to a :py:class:`CaptureCard` instance.
        video_source (:py:class:`models.ForeignKey`): Foreign key to a :py:class:`VideoSource` instance.
        system (:py:class:`models.ForeignKey`): Foreign key to a :py:class:`System` instance.
    """
    
    capture_card = models.ForeignKey(CaptureCard, on_delete=models.SET_NULL, blank=True, null=True)
    video_source = models.ForeignKey(VideoSource, on_delete=models.SET_NULL, blank=True, null=True)
    system = models.ForeignKey(System, on_delete=models.SET_NULL, blank=True, null=True)

    def get_label(self):
        return "label"

    def __str__(self):
        """Provide a string representation to the object."""
        return str(self.system) + " | " + str(self.video_source)