# -*- coding: utf-8 -*-
__author__ = 'Asutosh Sahoo'
__copyright__ = 'Copyright (©) 2019. Athenas Owl. All rights reserved.'
__credits__ = ['Quantiphi Analytics']

# Python dependencies
import csv
import requests
from requests_toolbelt import MultipartEncoder

# Django dependencies
from django.urls import resolve

# Project dependencies
from common.util.constants import Constant


def make_table_dict(request, channels):
    '''
    Creates a dictionary from GET parameters in request object where 
    key = filter_attribute (parameter_name)
    value = corresponding_value (parameter_value)
    
    @params:
        request = request object containing the GET parameters
        channels = QuerySet with each element having `channel_value` and `channel_name` parameters

    @returns:
        table_dict = a python dictionary containing filter attributes.
    '''

    # get the name of the URL-VIEW mapping
    url_view_mapping_name = resolve(request.path_info).url_name

    # extract GET parameters from request object into a dictionary (values in dict are of type LIST)
    table_dict = dict(request.GET)
    
    # unpack values corresponding to all keys, except `channel_values` which can have multiple values
    for key, value in table_dict.items():
        if key != 'channel_values':
            table_dict[key] = value[0]
    
    # map `channel_values` to `channel_names` and remove the `channel_values` key from dict
    if table_dict.get('channel_values'):
        channel_values = [int(x) for x in table_dict['channel_values']]
        channel_names = [t['channel_name'] for t in channels.filter(channel_value__in=channel_values)]
        table_dict['channel_names'] = channel_names
        table_dict.pop("channel_values", None)
    
    # Adding table information to dictionary
    if url_view_mapping_name == 'ui-recording':
        table_dict['table'] =  'Recording'
    elif url_view_mapping_name == 'ui-blank':
        table_dict['table'] =  'Invalid Frame Tracking'
    
    return table_dict

def make_table_html(table_dict):
    '''
    Takes a python dictionary and generates its corresponding HTML table with dictionary keys as column headings and
    dictionary values as column values

    @params:
        table_dict = dictionary

    @returns:
        table_html = HTML string
    '''
    
    if not table_dict:
        return ''
    
    table_head_html = ''
    table_body_html = ''

    if table_dict.get('table'):
        table_head_html += '<th>Table</th>'
        table_body_html += '<td>' + table_dict.get('table') + '</td>'

    if table_dict.get('date'):
        table_head_html += '<th>Date</th>'
        table_body_html += '<td>' + table_dict.get('date') + '</td>'

    if table_dict.get('start_date'):
        table_head_html += '<th>Start Date</th>'
        table_body_html += '<td>' + table_dict.get('start_date') + '</td>'
    
    if table_dict.get('end_date'):
        table_head_html += '<th>End Date</th>'
        table_body_html += '<td>' + table_dict.get('end_date') + '</td>'
    
    if table_dict.get('start_time') and table_dict.get('finish_time'):
        table_head_html += '<th>Time Interval</th>'
        table_body_html += '<td>' + table_dict.get('start_time') + ' - ' + table_dict.get('finish_time') + '</td>'
    
    if table_dict.get('timezone'):
        table_head_html += '<th>Timezone</th>'
        table_body_html += '<td>' + table_dict.get('timezone') + '</td>'
    
    if table_dict.get('channel_names'):
        table_head_html += '<th>Channel Names</th>'
        table_body_html += '<td>' + str(table_dict.get('channel_names')) + '</td>'
    
    if table_dict.get('device_id'):
        table_head_html += '<th>Device</th>'
        table_body_html += '<td>' + table_dict.get('device_id') + '</td>'
    
    if table_dict.get('request_id'):
        table_head_html += '<th>Request ID</th>'
        table_body_html += '<td>' + table_dict.get('request_id') + '</td>'

    table_head_html = '<thead><tr>' + table_head_html + '</tr></thead>'
    table_body_html = '<tbody><tr>' + table_body_html + '</tr></tbody>'

    table_html = '<table class="table table-bordered table-hover" style="font-size: 12px">' + table_head_html + table_body_html + '</table>'
    
    return table_html

def write_datatable_export_to_csv(datatable_export, csv_path):
    '''
    Write the datatable_export data  into a csv file
    '''

    with open(csv_path, mode='w') as csv_file:
            fieldnames = datatable_export['header']
            writer = csv.writer(csv_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_ALL)

            writer.writerow(fieldnames)

            for row in datatable_export['body']:
                writer.writerow(row)

def send_attached_mail(receiver_email, attachment, subject='', message=''):
    '''
    Sends mail and returns the response

    reciever_mail and attachment are compulsory

    @params:
        receiver_email = email address of the receiver in string (MANDATORY)
        attachment = python dictionary 
                    {
                        "name": <expected attachment name>,
                        "path": <path to the attachment file>
                    }
        subject = Subject of the mail
        message = Body of the mail

    @returns:
        response = 
    '''

    fields = {
                'receiver': receiver_email,
                'subject': subject,
                'message': message,
                'file': (attachment['name'], open(attachment['path'], 'rb')),
                'key': Constant.EMAIL_CLOUD_FUNCTION_AUTH_KEY
            }

    data = MultipartEncoder(fields = fields)
    response = requests.post(Constant.EMAIL_CLOUD_FUNCTION_URL, data=data, headers={'Content-Type': data.content_type})

    return response
