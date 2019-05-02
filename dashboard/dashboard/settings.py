# -*- coding: utf-8 -*-
__author__ = 'Asutosh Sahoo'
__copyright__ = 'Copyright (©) 2019. Athenas Owl. All rights reserved.'
__credits__ = ['Quantiphi Analytics']
"""
Django settings for the Dashboard project.
"""

# Python related dependencies
import os
import configparser

# Project related dependencies
from common.util.constants import Constant

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

config = configparser.ConfigParser()
config.read(Constant.PARAMETERS_INI_PATH)
DEFAULT = configparser.DEFAULTSECT

SECRET_KEY = config.get(DEFAULT, 'SECRET_KEY', fallback='(*&y98hsdfa89y238h')
DEBUG = config.getboolean(DEFAULT, 'DEBUG', fallback='False')
ALLOWED_HOSTS = config.get(DEFAULT, 'ALLOWED_HOSTS', fallback='*').split(',')

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'django_filters',
    'rest_api.apps.RestApiConfig',
    'ui.apps.UiConfig',
    'graph_ui.apps.GraphUiConfig',
    'schedule.apps.ScheduleConfig',
    'monitoring.apps.MonitoringConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

CORS_ORIGIN_ALLOW_ALL = True

ROOT_URLCONF = 'dashboard.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'dashboard.wsgi.application'

# Database
# https://docs.djangoproject.com/en/1.11/ref/settings/#databases

#Populating Databases from parameters.ini
DB_DEFAULT = {
    'ENGINE': config.get(DEFAULT, 'DB_ENGINE', fallback='django.db.backends.mysql'),
    'HOST': config.get(DEFAULT, 'DB_HOST', fallback='localhost'),
    'USER': config.get(DEFAULT, 'DB_USERNAME', fallback='root'),
    'PASSWORD': config.get(DEFAULT, 'DB_PASSWORD', fallback='12345'),
    'NAME': config.get(DEFAULT, 'DB_NAME', fallback='sys'),
    'PORT': config.get(DEFAULT, 'DB_PORT', fallback='3306'),
}


DATABASES = {
    'default': DB_DEFAULT
}

for section in ['db_monitoring', 'db_rest_api']:
    if section in config.sections():
        DATABASES[section] = {
            'ENGINE': config.get(section, 'ENGINE'),
            'HOST': config.get(section, 'HOST'),
            'USER': config.get(section, 'USERNAME'),
            'PASSWORD': config.get(section, 'PASSWORD'),
            'NAME': config.get(section, 'NAME'),
            'PORT': config.get(section, 'PORT'),
        }
    else:
        DATABASES[section] = DB_DEFAULT


DATABASE_ROUTERS = (
    'rest_api.dbrouters.CloudDBRouter',
    'monitoring.dbrouters.MonitoringDBRouter',
    'schedule.dbrouters.ScheduleAPIDBRouter',
)


# Password validation
# https://docs.djangoproject.com/en/1.11/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/1.11/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.11/howto/static-files/

STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "common/static"),
]

STATIC_ROOT = os.path.join(BASE_DIR, 'static')
STATIC_URL = '/static/'


# Media Files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

LOGIN_REDIRECT_URL = 'graph-recording'
LOGIN_URL = 'login'

