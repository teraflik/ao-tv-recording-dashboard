from django.urls import resolve

def make_table_dict(request, channels):
    current_url = resolve(request.path_info).url_name

    # table_dict = dict(request.GET._iterlists())
    table_dict = dict(request.GET)
    
    for key, value in table_dict.items():
        if key != 'channel_values':
            table_dict[key] = value[0]
    
    # map channel_values to channel_names and remove the channel_values key
    if table_dict.get('channel_values'):
        channel_values = [int(x) for x in table_dict['channel_values']]
        channel_names = [t['channel_name'] for t in channels.filter(channel_value__in=channel_values)]
        table_dict['channel_names'] = channel_names
        table_dict.pop("channel_values", None)
    
    # Adding table information to dictionary
    if current_url == 'ui-recording':
        table_dict['table'] =  'Recording'
    elif current_url == 'ui-blank':
        table_dict['table'] =  'Invalid Frame Tracking'
    
    return table_dict

def make_table_html(table_dict):
    
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
