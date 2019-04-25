from . import models

class ScheduleAPIDBRouter(object):
    """
    A router to control schedule_api db operations
    """
    def db_for_read(self, model, **hints):
        "Point all operations on schedule_api models to 'db_monitoring'"

        if model._meta.app_label == 'schedule_api':
            return 'db_monitoring'
        return None

    def db_for_write(self, model, **hints):
        "Point all operations on schedule_api models to 'db_monitoring'"

        if model._meta.app_label == 'schedule_api':
            return 'db_monitoring'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        "Allow any relation if a model in schedule_api is involved"

        if obj1._meta.app_label == 'schedule_api' or obj2._meta.app_label == 'schedule_api':
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        "Make sure the schedule_api app only appears on the 'schedule_api' db"

        if app_label == 'schedule_api':
            return db == 'db_monitoring'
        return None