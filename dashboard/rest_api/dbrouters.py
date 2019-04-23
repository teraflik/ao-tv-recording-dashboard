# -*- coding: utf-8 -*-
__author__ = "Asutosh Sahoo"
__copyright__ = "Copyright (©) 2019. Athenas Owl. All rights reserved."
__credits__ = ["Quantiphi Analytics"]

from .models import FilterRecordingTracking


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
