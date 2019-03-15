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

# move to /var/www/html
cd /var/www/html

# create /var/.ao directory where parameters.ini will be stored
sudo mkdir /var/.ao
# download the file from bucket (needs permission to download from bucket)
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
