import io
import os
import subprocess
from contextlib import redirect_stdout

from ansi2html import Ansi2HTMLConverter
from django.contrib.auth.decorators import login_required
from django.http import (HttpResponse, HttpResponseNotFound,
                         HttpResponseServerError, JsonResponse)
from django.template.response import TemplateResponse

from .ao_inventory import AOInventoryManager, OBSWebsocket
from .models import Node

@login_required
def index(request):
    return TemplateResponse(request, 'dashboard/monitoring.html')

@login_required
def nodes(request, node_id=None):
    """
    Returns information about a node given its primary key (`node_id`) as JSONResponse.
    If no `node_id` is specified, returns information about all the nodes in database.
    """
    #return JsonResponse({"nodes": [{"id": 1, "ip_address": "192.168.2.35", "label": "Asutosh", "ping": True, "obs_status": "Not Running", "channel_id": "1", "uptime": "up 3 hours, 31 minutes", "cron": "* * * * * cd /home/user/Documents/asutosh/athenas-owl/ao-shell && touch log_file && echo `date` >> log_file", "screenshot_url": "/media/screenshots/1_Asutosh_lDJtjyZ.jpg"}, {"id": 3, "ip_address": "192.168.2.34", "label": "Rishabh", "ping": True, "obs_status": "Not Running", "channel_id": "Test", "uptime": "up 3 days, 3 hours, 31 minutes", "cron": "no crontab for user", "screenshot_url": "/media/screenshots/3_Rishabh_oczZIth.jpg"}, {"id": 7, "ip_address": "192.168.2.234", "label": "TV Recording Beta", "ping": True, "obs_status": "Not Running", "channel_id": "0", "uptime": "up 3 days, 1 hour, 37 minutes", "cron": "no crontab for user", "screenshot_url": None}]})
    nodes = []
    inv = AOInventoryManager()
    
    queryset = Node.objects.filter(pk=node_id) if node_id else Node.objects.all()
    
    for node in queryset:
        if inv.ping(node.ip_address):
            nodes.append({
                "id": node.pk,
                "ip_address": node.ip_address,
                "label": node.label,
                "ping": True,
                "obs_status": inv.obs_status(node.ip_address),
                "channel_id": inv.get_channel_id(node.ip_address, node.username, node.password),
                "uptime": inv.get_uptime(node.ip_address, node.username, node.password),
                "cron": inv.get_cron(node.ip_address, node.username, node.password),
                "screenshot_url": node.screenshot_url
            })
        else:
            nodes.append({
                "id": node.pk,
                "ip_address": node.ip_address,
                "label": node.label,
                "ping": False,
                "screenshot_url": node.screenshot_url
            })
    
    return JsonResponse(data = {"nodes": nodes})

@login_required
def screenshot(request, node_id):
    try:
        node = Node.objects.get(pk=node_id)
    except Node.DoesNotExist:
        return HttpResponseNotFound()
    inv = AOInventoryManager()
    image = inv.get_screengrab(node.ip_address, node.username, node.password)
    node.update_screenshot(image)
    if request.GET.get("response") == "json":
        return JsonResponse(data = {"screenshot_url": node.screenshot_url})
    return HttpResponse(image, content_type="image/jpeg")

@login_required
def obs(request, node_id):
    """
    Manages OBS running on a node via OBSWebsocket instance.
    GET parameter `action` supports `start_recording`, `stop_recording`.
    Response is True on successful completion of the specified action.
    In absence of the action parameter, returns the current recording status of OBS.
    """
    try:
        node = Node.objects.get(pk=node_id)
    except Node.DoesNotExist:
        return HttpResponseNotFound()

    try:
        obs = OBSWebsocket(node.ip_address)
        if request.GET.get("action") == "start_recording":
            response = obs.start_recording()
        elif request.GET.get("action") == "stop_recording":
            response = obs.stop_recording()
        elif request.GET.get("action") == "refresh_source":
            response = obs.refresh_source()
        else:
            response = "Recording" if obs.recording_status() else "Not Recording"
    except ConnectionError:
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
