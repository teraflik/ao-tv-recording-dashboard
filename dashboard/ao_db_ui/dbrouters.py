from monitoring import models
from rest_api.models import FilterRecordingTracking

class DashboardRouter(object):
    def db_for_read(self, model, **hints):
        pass

    def db_for_write(self, model, **hints):
        pass

class CloudDBRouter(object):

    def db_for_read(self, model, **hints):
        """ reading FilterRecordingTracking from barc-prod """
        if model == FilterRecordingTracking:
            return 'rest_api'
        return None

    def db_for_write(self, model, **hints):
        """ writing FilterRecordingTracking to barc-prod """
        if model == FilterRecordingTracking:
            return 'rest_api'
        return None
