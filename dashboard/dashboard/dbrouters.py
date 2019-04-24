from monitoring import models
from rest_api.models import FilterRecordingTracking

class CloudDBRouter(object):

    def db_for_read(self, model, **hints):
        """ reading FilterRecordingTracking from barc-prod """
        if model == FilterRecordingTracking:
            return 'db_rest_api'
        return None

    def db_for_write(self, model, **hints):
        """ writing FilterRecordingTracking to barc-prod """
        if model == FilterRecordingTracking:
            return 'db_rest_api'
        return None

class MonitoringDBRouter(object):
    """
    A router to control monitoring db operations
    """
    def db_for_read(self, model, **hints):
        "Point all operations on monitoring models to 'db_monitoring'"
        from django.conf import settings
        if 'db_monitoring' not in settings.DATABASES:
            return None
        if model._meta.app_label == 'monitoring':
            return 'db_monitoring'
        return None

    def db_for_write(self, model, **hints):
        "Point all operations on monitoring models to 'db_monitoring'"
        from django.conf import settings
        if 'db_monitoring' not in settings.DATABASES:
            return None
        if model._meta.app_label == 'monitoring':
            return 'db_monitoring'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        "Allow any relation if a model in monitoring is involved"
        from django.conf import settings
        if 'db_monitoring' not in settings.DATABASES:
            return None
        if obj1._meta.app_label == 'monitoring' or obj2._meta.app_label == 'monitoring':
            return True
        return None

    def allow_syncdb(self, db, model):
        "Make sure the monitoring app only appears on the 'monitoring' db"
        from django.conf import settings
        if 'db_monitoring' not in settings.DATABASES:
            return None
        if db == 'db_monitoring':
            return model._meta.app_label == 'monitoring'
        elif model._meta.app_label == 'monitoring':
            return False
        return None