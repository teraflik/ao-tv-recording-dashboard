import datetime
import io
import os
import json
from contextlib import redirect_stdout

from ansi2html import Ansi2HTMLConverter
from django.contrib.auth.decorators import login_required
from django.http import (HttpResponse, HttpResponseNotFound,
                         HttpResponseServerError, JsonResponse)
from django.template.response import TemplateResponse
from django.shortcuts import render

from rest_api.models import RecordingGuide

from .ao_inventory import AOInventoryManager, OBSWebsocket
from .models import CaptureCard, Node, System, VideoSource


@login_required
def index(request):
    """
    Renders the Nodes page.
    """
    return TemplateResponse(request, 'monitoring/index.html')

@login_required
def nodes(request, node_id=None):
    """
    Returns information about a node in JSON given its unique ID.

    If no `node_id` is specified, returns information about all the nodes in database.

    Args:
        request (:obj:`django.http.request.Request`): An HTTPRequest parameter. 
            Can be used in future to parse custom GET parameters.
        node_id (int): The unique ID of the Node, for which information is required. 
            If `None`, returns returns info about all the nodes in the database.
    
    Returns:
        :obj:`django.http.JSONResponse` object containing information about the 
        desired nodes as a list.

        Each item in the list is a dictionary with the following keys:

            - ``id``: The unique integer ID of the Node.
            - ``ip_address``: IP address or hostname of the Node.
            - ``label``: The custom label for the Node.
            - ``ping``: Whether the Node responded to a Ping (ICMP) request.
            - ``channel_id``: The channel ID currently configured on the Node's ``/home/user/Desktop/TV/scripts/channel_value.txt`` file. 
            - ``uptime``: The total uptime of the Node in HH:MM format.
            - ``cron``: The output of ``crontab -l`` command on the Node (might need to be sanitized).
            - ``screenshot_url``: A URL to the screenshot that was last captured on the Node``s primary display.
            - ``netdata_host``: The host:port combination on which Node's Netdata daemon is exposed.
            - ``slots``: The active entries in Recording Guide correspondng to this node.
        
        Note:
            If ping fails, the fields following ping will be empty.

    """
    nodes = []
    inv = AOInventoryManager()
    
    queryset = Node.objects.filter(pk=node_id) if node_id else Node.objects.all()
    
    for node in queryset:
        if inv.ping(node.system.ip_address):
            nodes.append({
                "id": node.pk,
                "ip_address": node.system.ip_address,
                "label": str(node),
                "ping": True,
                "channel_id": inv.get_channel_id(node.system.ip_address, node.system.username, node.system.password),
                "uptime": inv.get_uptime(node.system.ip_address, node.system.username, node.system.password),
                "cron": inv.get_cron(node.system.ip_address, node.system.username, node.system.password),
                "screenshot_url": node.system.screenshot_url,
                "netdata_host": node.system.netdata_host,
                "slots": list(RecordingGuide.objects.filter(
                    node=node, 
                    validity_end__gte=datetime.date.today()
                    ).values(
                        "channel_value_id__channel_name",
                        "device_id",
                        "start_time",
                        "stop_time",
                        "monday",
                        "tuesday",
                        "wednesday",
                        "thursday",
                        "friday",
                        "saturday",
                        "sunday",
                    )),
            })
        else:
            nodes.append({
                "id": node.pk,  
                "ip_address": node.system.ip_address,
                "label": node.__str__(),
                "ping": False,
                "channel_id": None,
                "uptime": None,
                "cron": None,
                "screenshot_url": None,
                "netdata_host": None,
                "slots": None,
            })
    
    return JsonResponse(data = {"nodes": nodes})

@login_required
def screenshot(request, node_id):
    """
    Take screenshot and return as ``content_type=image`` response.
    If ``?response=json`` is specified, returns the ``screenshot_url`` as JsonResponse.
    """
    try:
        node = Node.objects.get(pk=node_id)
    except Node.DoesNotExist:
        return HttpResponseNotFound()
    inv = AOInventoryManager()
    image = inv.get_screengrab(node.system.ip_address, node.system.username, node.system.password)
    node.system.update_screenshot(image)
    if request.GET.get("response") == "json":
        return JsonResponse(data = {"screenshot_url": node.system.screenshot_url})
    return HttpResponse(image, content_type="image/jpeg")

@login_required
def obs(request, node_id):
    """
    Manages OBS running on a remote machine via OBSWebsocket.

    Args:
        request (:obj:`django.http.request.Request`): An HTTPRequest, containing 
            GET parameter ``action`` with one of the following values:
                
                - ``?action=is_running``: Checks if obs is running.
                - ``?action=is_recording``: Checks if obs is recording.
                - ``?action=start_recording``: Sends a command to start recording.
                - ``?action=stop_recording``: Sends a command to stop recording.
                - ``?action=reset_source``: Sends a command to reset source.

            If any other value is specified, the default response is returned.

        node_id (int): The unique ID of the Node, on which the action is to be performed.
            OBS must be running on the Node for desired results.

    Returns:
        Result of the specified action. In absence of the action parameter, returns 
        the current recording status of OBS (Default Response).
    """
    try:
        node = Node.objects.get(pk=node_id)
    except Node.DoesNotExist:
        return HttpResponseNotFound()

    try:
        obs = OBSWebsocket(node.system.ip_address)
        if request.GET.get("action") == "is_running":
            response = True
        elif request.GET.get("action") == "is_recording":
            response = obs.is_recording()
        elif request.GET.get("action") == "start_recording":
            response = obs.start_recording()
        elif request.GET.get("action") == "stop_recording":
            response = obs.stop_recording()
        elif request.GET.get("action") == "reset_source":
            response = obs.reset_source()
        else:
            response = "Recording" if obs.is_recording() else "Not Recording"
    except ConnectionError:
        if request.GET.get("action") == "is_running":
            response = False
        else:
            response = "Not Running"

    return JsonResponse(data = {"response": response})

@login_required
def deploy(request, node_id):
    try:
        node = Node.objects.get(pk=id)
    except Node.DoesNotExist:
        return HttpResponseNotFound("Not found!")

    with io.StringIO() as buf, redirect_stdout(buf):
        result = tvrp.run(node.label)
        output = buf.getvalue()
        inv.destroy()
    
    conv = Ansi2HTMLConverter(inline=True)
    html = conv.convert(output)

    if result > 0:
        return HttpResponseServerError(html)
    else:
        return HttpResponse(html)
