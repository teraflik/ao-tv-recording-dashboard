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
    return TemplateResponse(request, 'monitoring/monitoring.html')

@login_required
def nodes(request, node_id=None):
    """
    Returns information about a node given its primary key (`node_id`) as JSONResponse.
    If no `node_id` is specified, returns information about all the nodes in database.
    """
    #return JsonResponse({"nodes": [{"id": 1, "ip_address": "192.168.2.35", "label": "Asutosh", "ping": True, "channel_id": "cat: /home/user/Desktop/TV/scripts/channel_value.txt: No such file or directory", "uptime": "32:24", "cron": "* * * * * cd /home/user/Documents/asutosh/athenas-owl/ao-shell && touch log_file && echo `date` >> log_file\n0 12 * * 1-5 cd /home/user", "screenshot_url": "/media/screenshots/1_Asutosh_RhKJYyT.jpg"}, {"id": 2, "ip_address": "192.168.2.34", "label": "Rishabh", "ping": True, "channel_id": "cat: /home/user/Desktop/TV/scripts/channel_value.txt: No such file or directory", "uptime": "103:42", "cron": "no crontab for user", "screenshot_url": "/media/screenshots/2_Rishabh_JeIjweG.jpg"}, {"id": 3, "ip_address": "192.168.2.234", "label": "TV Recording Beta", "ping": True, "channel_id": "99", "uptime": "23:02", "cron": "PATH=/home/user/bin:/home/user/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin\n35 18 * * * bash /home/user/Desktop/TV/scripts/batch/obs-start.sh >> /home/user/Desktop/TV/scripts/batch/obs-start.txt\n37 18 * * * bash /home/user/Desktop/TV/scripts/batch/obs-stop.sh >> /home/user/Desktop/TV/scripts/batch/obs-stop.txt", "screenshot_url": "/media/screenshots/3_TV_Recording_Beta_MRAEVKU.jpg"}]})
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
    GET parameter `action` supports many arguments.
    Response is True on successful completion of the specified action.
    In absence of the action parameter, returns the current recording status of OBS.
    """
    try:
        node = Node.objects.get(pk=node_id)
    except Node.DoesNotExist:
        return HttpResponseNotFound()

    try:
        obs = OBSWebsocket(node.ip_address)
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
