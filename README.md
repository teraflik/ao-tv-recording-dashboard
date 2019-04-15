# ao-tv-recording-db-ui <a href="https://athenasowl.tv"><img align="right" src="https://imgur.com/rJzO7hX.png"></a>

A UI to track TV recording status.

## Problem Statement

Develop a UI for monitoring and tracking TV recording with the following functionalities

- Table view to track individual request_ID at a daily level for a specific channel (a or b device)
- Graph view to track individual request_ID at a daily level for a specific channel (a or b device)
- Weekly tracking of specific channel blanks frame rate in an individual channel of the particular date or date range
- Get the information of data loss on the channel of a particular date
- Downtime checklist for taggers

### Setting up SSL Reverse Proxy

- Install apache2 libapache2-mod-wsgi-py3
- Copy rtc.conf to sites-available
- a2dissite 000-default
- a2ensite rtc
- a2enmod ssl
- a2enmod proxy_http
- a2enmod headers
- a2enmod proxy_html


## Apache config
<VirtualHost *:80> 
	ServerName recording.athenasowl.tv 
	Redirect permanent / https://recording.athenasowl.tv
</VirtualHost>

<IfModule mod_ssl.c>
	<VirtualHost _default_:443>
		ServerName recording.athenasowl.tv
		ServerAdmin raghav.khandelwal@quantiphi.com
			
		<Directory /home/user/Documents/ao-tv-recording-db-ui/dashboard/ao_db_ui>
			<Files wsgi.py>
				Require all granted
			</Files>
		</Directory>
			
		Alias /static /home/user/Documents/ao-tv-recording-db-ui/dashboard/static
		<Directory /home/user/Documents/ao-tv-recording-db-ui/dashboard/static>
			Require all granted
		</Directory>
		
		Alias /media /home/user/Documents/ao-tv-recording-db-ui/dashboard/media
		<Directory /home/user/Documents/ao-tv-recording-db-ui/dashboard/media>
			Require all granted
		</Directory>
	
		ErrorLog ${APACHE_LOG_DIR}/error.log
		CustomLog ${APACHE_LOG_DIR}/access.log combined

		SSLEngine on

		SSLCertificateFile	/etc/ssl/certs/a5b52472eb2ead2f.crt
		SSLCertificateKeyFile /etc/ssl/private/athenasowl.key

		<FilesMatch "\.(cgi|shtml|phtml|php)$">
				SSLOptions +StdEnvVars
		</FilesMatch>
		<Directory /usr/lib/cgi-bin>
				SSLOptions +StdEnvVars
		</Directory>
		
		ProxyRequests Off 
		ProxyPreserveHost On
        
	        ProxyPassMatch "^/monitoring/netdata/([0-9]+)-([0-9]+)-([0-9]+)-([0-9]+)/(.*)" "http://$1.$2.$3.$4:19999/$5" connectiontimeout=5 timeout=30 keepalive=on

		WSGIDaemonProcess dashboard python-path=/home/user/Documents/ao-tv-recording-db-ui/dashboard python-home=/home/user/Documents/ao-tv-recording-db-ui/env user=user
		WSGIProcessGroup dashboard
		WSGIScriptAlias / /home/user/Documents/ao-tv-recording-db-ui/dashboard/ao_db_ui/wsgi.py


	</VirtualHost>
</IfModule>