## Setup Tv Recording UI WebApp on a fresh System

### Phase 1: Setting-up the SQL Server

```bash
# Download the sql dump file
gsutil cp gs://b-ao-intern-test2/sys1_dump.sql ~/sys1_dump.sql

######################################################################################
# Installing MySQL 8.0 in Ubuntu
######################################################################################

# Ref :- https://www.tecmint.com/install-mysql-8-in-ubuntu/
wget -c https://dev.mysql.com/get/mysql-apt-config_0.8.10-1_all.deb
sudo dpkg -i mysql-apt-config_0.8.10-1_all.deb

# Ref :- https://serverfault.com/questions/955299/mysql-repository-key-expired 
sudo apt-key adv --recv-keys --keyserver ha.pool.sks-keyservers.net 5072E1F5

# Update repository information to add mysql 8.0
sudo apt update

# Finally install mysql-server
sudo apt-get install mysql-server

# configure mysql-server
sudo mysql_secure_installation

# check if its running
sudo systemctl status mysql

# enable it to start at boot time
sudo systemctl enable mysql

# create a new database sys1
mysql -u root --password=12345 -e "create database sys1"

# import data from the dump
mysql -u root --password=12345 sys1 < ~/sys1_dump.sql
```





### Phase 2: Setting up the webapp

#### 1. Installing Dependencies

```bash
# update
sudo apt update
# installing virtualenv
sudo apt install virtualenv -y

# installing other dependencies
sudo apt install nano git -y
sudo apt install libmysqlclient-dev python-dev python3-dev build-essential libssl-dev -y
# install apache dependencies
sudo apt install python3-pip apache2 libapache2-mod-wsgi-py3 -y
```

#### 2. Running the webapp

Assumes :- 

1. Access to AthenasOwl-Intern Repositories
2. Access to athenas-owl-dev project in GCP
3. gsutil cp installed.

```bash
M# move to /var/www/html
sudo su
cd /var/www/html
# create /var/.ao directory where parameters.ini will be stored
sudo mkdir /var/.ao

# download the file from bucket
sudo gsutil cp gs://ao-parameters-dev/ao-tv-recording-db-ui/parameters.ini /var/.ao/parameters.ini

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

# copy the template.conf file to apache directory
sudo cp template.conf /etc/apache2/sites-available/ao-tv-recording-db-ui.conf

# set the values of placeholder variables
project_name=ao_db_ui
project_path=$PWD
venv_name=env

# replace placeholders from template file
sudo sed -i -e "s:{project_path}:$project_path:g" -e "s:{project_name}:$project_name:g" -e "s:{venv_name}:$venv_name:g" /etc/apache2/sites-available/ao-tv-recording-db-ui.conf

# create a symlink from sites-available/ao-tv... .conf to sites-enables/ao-tv... .conf
sudo ln -s /etc/apache2/sites-available/ao-tv-recording-db-ui.conf /etc/apache2/sites-enabled/ao-tv-recording-db-ui.conf

# remove the previous symlink in sites-enabled
sudo rm /etc/apache2/sites-enabled/000-default.conf

# restart the apache web service
sudo service apache2 restart

# # run the webapp
# python manage.py runserver 0.0.0.0.:8000
```
