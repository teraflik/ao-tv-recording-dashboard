This documents the changes needed to be done to port the project from `django==1.11.4` to `django==2.1.7`.

* Install django==2.1.7
* Install djangorestframework==3.9.2
* Restart Apache manually.
* Change `"{% url 'ui-recording' %}"` ---> `"{% url 'ui:ui-recording' %}"` in **home.html**
* Change `dict(request.GET._iterlists())` ---> `dict(request.GET)`

