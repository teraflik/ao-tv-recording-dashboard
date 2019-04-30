from django.contrib import admin

from .models import Schedule, Channel

admin.site.register(Channel)
admin.site.register(Schedule)
