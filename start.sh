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

sudo a2enmod ssl

# move to /var/www/html
cd /var/www/html

# create /var/.ao directory where parameters.ini will be stored
sudo mkdir /var/.ao
# download the file from bucket (needs permission to download from bucket)
sudo gsutil cp gs://ao-parameters-dev/ao-tv-recording-db-ui/parameters.ini /var/.ao/parameters.ini

# download the certificates from the bucket
sudo gsutil cp gs://ao-parameters-dev/ao-tv-recording-db-ui/athenasowl.key /etc/ssl/certs/
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
project_name=ao_db_ui
project_path=$PWD
venv_name=env
domain_name=recording.athenasowl.tv
crt_file_path=/etc/ssl/certs/a5b52472eb2ead2f.crt
key_file_path=/etc/ssl/certs/athenasowl.key
endpoint_restrictions=$(cat <<-EOF
    <Location /admin>
            Order deny,allow
            Deny from all
    </Location>
EOF
)

# create a new file ao-tv-recording-db-ui.conf in the /etc/apache2/sites-available/ folder.
touch /etc/apache2/sites-available/ao-tv-recording-db-ui.conf
# setup the conf file
cat > /etc/apache2/sites-available/ao-tv-recording-db-ui.conf << EOF
<VirtualHost *:80>
        ServerName ${domain_name}

        ServerAdmin webmaster@localhost
        DocumentRoot /var/www/html

        ErrorLog ${APACHE_LOG_DIR}/error.log
        CustomLog ${APACHE_LOG_DIR}/access.log combined

        Redirect permanent / https://${domain_name}/
</VirtualHost>

<VirtualHost *:443>
	ServerName ${domain_name}

	ServerAdmin webmaster@localhost
	DocumentRoot /var/www/html

	ErrorLog ${APACHE_LOG_DIR}/error.log
	CustomLog ${APACHE_LOG_DIR}/access.log combined

	Alias /static ${project_path}/static
	<Directory ${project_path}/static>
		Require all granted
	</Directory>

	<Directory ${project_path}/${project_name}>
		<Files wsgi.py>
			Require all granted
		</Files>
	</Directory>

	WSGIDaemonProcess ${project_name} python-path=${project_path} python-home=${project_path}/${venv_name}
	WSGIProcessGroup ${project_name}
	WSGIScriptAlias / ${project_path}/${project_name}/wsgi.py

	${endpoint_restrictions}

	SSLEngine on
	SSLCertificateFile ${crt_file_path}
	SSLCertificateKeyFile ${key_file_path}

</VirtualHost>
EOF

# create a symlink from sites-available/ao-tv... .conf to sites-enables/ao-tv... .conf
sudo ln -s /etc/apache2/sites-available/ao-tv-recording-db-ui.conf /etc/apache2/sites-enabled/ao-tv-recording-db-ui.conf
# remove the previous symlink in sites-enabled
sudo rm /etc/apache2/sites-enabled/000-default.conf
# restart the apache web service
sudo service apache2 restart
