from django.db import models
from django.core.files.base import ContentFile

# Create your models here.

class Node(models.Model):
    label = models.CharField(max_length=200, blank=True)
    ip_address = models.GenericIPAddressField(verbose_name="IP Address", blank=False)
    username = models.CharField(verbose_name="SSH Username", max_length=50, default="user", blank=False)
    password = models.CharField(verbose_name="SSH Password", max_length=100, default="12345", blank=False)
    mac_address = models.CharField(max_length=20, verbose_name="MAC Address", blank=True)
    screenshot = models.ImageField(verbose_name="Last Screenshot", upload_to='screenshots', blank=True)

    def __str__(self):
        return self.ip_address
    
    def update_screenshot(self, image):
        image_name = "{:d}_{:s}.jpg".format(self.pk, self.label)
        self.screenshot.save(image_name, ContentFile(image), save=True)
    
    @property
    def screenshot_url(self):
        if self.screenshot and hasattr(self.screenshot, 'url'):
            return self.screenshot.url