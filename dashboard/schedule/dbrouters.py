from . import models

class ScheduleAPIDBRouter(object):
    """
    A router to control schedule db operations
    """
    def db_for_read(self, model, **hints):
        "Point all operations on schedule models to 'db_monitoring'"

        if model._meta.app_label == 'schedule':
            return 'db_monitoring'
        return None

    def db_for_write(self, model, **hints):
        "Point all operations on schedule models to 'db_monitoring'"

        if model._meta.app_label == 'schedule':
            return 'db_monitoring'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        "Allow any relation if a model in schedule is involved"

        if obj1._meta.app_label == 'schedule' or obj2._meta.app_label == 'schedule':
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        "Make sure the schedule app only appears on the 'schedule' db"

        if app_label == 'schedule':
            return db == 'db_monitoring'
        return None