from . import models

class MonitoringDBRouter(object):
    """
    A router to control monitoring db operations
    """
    def db_for_read(self, model, **hints):
        "Point all operations on monitoring models to 'db_monitoring'"

        if model._meta.app_label == 'monitoring':
            return 'db_monitoring'
        return None

    def db_for_write(self, model, **hints):
        "Point all operations on monitoring models to 'db_monitoring'"

        if model._meta.app_label == 'monitoring':
            return 'db_monitoring'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        "Allow any relation if a model in monitoring is involved"

        if obj1._meta.app_label == 'monitoring' or obj2._meta.app_label == 'monitoring':
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        "Make sure the monitoring app only appears on the 'db_monitoring' db"

        if app_label == 'monitoring':
            return db == 'db_monitoring'
        elif db == 'db_monitoring':
            return False

        return None