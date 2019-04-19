# switch to root user
sudo su
# update
sudo apt update
# installing virtualenv
sudo apt install virtualenv -y
# installing other dependencies
sudo apt install nano git -y
sudo apt install libmysqlclient-dev python-dev python3-dev build-essential libssl-dev -y
# install apache dependencies
sudo apt install python3-pip apache2 libapache2-mod-wsgi-py3 -y

sudo a2enmod ssl proxy_http headers proxy_html

# move to /var/www/html
cd /var/www/html

# create /var/.ao directory where parameters.ini will be stored
sudo mkdir /var/.ao
# download the file from bucket (needs permission to download from bucket)
sudo gsutil cp gs://ao-parameters-dev/ao-tv-recording-db-ui/parameters.ini /var/.ao/parameters.ini

# download the certificates from the bucket
sudo gsutil cp gs://ao-parameters-dev/ao-tv-recording-db-ui/athenasowl.key /etc/ssl/private/
sudo gsutil cp gs://ao-parameters-dev/ao-tv-recording-db-ui/a5b52472eb2ead2f.crt /etc/ssl/certs/


# Clone the GitHub Repo (private repo, needs authentication)
sudo git clone https://gitlab.com/athenasowl-intern/ao-tv-recording-db-ui.git
# move into the repo
cd ao-tv-recording-db-ui/
# checkout the development branch
sudo git checkout development
# create a virtualenv using python3
sudo virtualenv env -p python3
# activate the virtualenv
source env/bin/activate
# installing pip requirements
pip install -r requirements.txt
# collect static files
python manage.py collectstatic

# set the values of placeholder variables
project_name=dashboard
project_path=$PWD
venv_name=env
domain_name=recording.athenasowl.tv
crt_file_path=/etc/ssl/certs/a5b52472eb2ead2f.crt
key_file_path=/etc/ssl/private/athenasowl.key
endpoint_restrictions=$(cat <<-EOF
    <Location /admin>
            Order deny,allow
            Deny from all
    </Location>
EOF
)

# create a new file ao-tv-recording-db-ui.conf in the /etc/apache2/sites-available/ folder.
touch /etc/apache2/sites-available/dashboard.conf
# setup the conf file
cat > /etc/apache2/sites-available/dashboard.conf << EOF
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
EOF

# create a symlink from sites-available/ao-tv... .conf to sites-enables/ao-tv... .conf
sudo a2ensite dashboard
# remove the previous symlink in sites-enabled
sudo a2dissite 000-default
# restart the apache web service
sudo service apache2 restart
