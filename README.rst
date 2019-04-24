**********************
TV Recording Dashboard
**********************

.. image:: https://gitlab.com/athenasowl-intern/ao-tv-recording-dashboard/badges/master/pipeline.svg
   :alt: Pipeline Status [Master]
   :target: https://gitlab.com/athenasowl-intern/ao-tv-recording-dashboard/commits/master

Track and manage TV Recording Pipeline, from anywhere.

Installation
============
The application can be installed either by using the provided startup script, or
by following the given steps::

    git clone git@gitlab.com:athenasowl-intern/ao-tv-recording-dashboard.git
    cd ao-tv-recording-dashboard
    virtualenv env -p python3
    source env/bin/activate
    pip install -r requirements.txt

Database Configuration
-----------------------
The credentials are read from ``/var/.ao/parameters.ini``. A backup of the current
 configuration can be found in GCP bucket.

A superuser is required to access the admin interface::

    python manage.py createsuperuser

Local Deployment
----------------
::

    python manage.py runserver

Browse to 127.0.0.1:8000 

Deployment on Apache
--------------------
::

    python manage.py collectstatic

Place the SSL certificate and key file in ``/etc/ssl/certs`` and ``/etc/ssl/keys`` 
respectively.
Copy the contents of [dashboard.conf](dashboard.conf) to ``/etc/apache2/sites-available/dashboard.conf``

Enable ``dashboard`` in apache2 and restart::

    sudo a2dissite 000-default
    sudo a2ensite dashboard
    sudo systemctl restart apache2

Onboarding New Node
===================

Navigate to ``<root-url>/admin`` to visit the django-admin interface. Open **Nodes**
under **Monitoring** section. You will find a list of currently configured Nodes, with 
all their details.

Click on **Add Node** on the top right to add a new Node to the list. Refer 
:py:class:`monitoring.models.Node` for details about each field.

.. note::
    The current apache configuration allows using the server as a SSL reverse-proxy
    for accessing netdata endpoint running on TV Recording Nodes.
    To leverage this, use https prefixed URLS for **Netdata Host** with the syntax::

        https://<root-url>/monitoring/netdata/<ip_with_hyphens_instead_of_dots>

    Example:

        https://recording.athenasowl.tv/monitoring/netdata/192-168-2-234/
        
        maps to:
        
        http://192.168.2.234:19999/


Problem Statement
=================
Develop a UI for monitoring and tracking TV recording with the following functionalities

- Table view to track individual request_ID at a daily level for a specific channel (a or b device)
- Graph view to track individual request_ID at a daily level for a specific channel (a or b device)
- Weekly tracking of specific channel blanks frame rate in an individual channel of the particular date or date range
- Get the information of data loss on the channel of a particular date
- Downtime checklist for taggers