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

# finally, run it
sudo mysql -u root -p
```

```mysql
create database sys1;
exit;
```

```bash
# Load the database tables from dump
mysql -u root --password=12345 sys1 < ~/sys1_dump.sql
```



### Phase 2: Setting up the webapp

#### 1. Installing Dependencies

```bash
# installing virtualenv
sudo apt install virtualenv

# installing other dependencies
sudo apt-get install libmysqlclient-dev
sudo apt-get install python-dev
sudo apt-get install python3-dev
sudo apt-get install build-essential
sudo apt-get install libssl-dev
```

#### 2. Running the webapp

```bash
# Clone the GitHub Repo
git clone https://gitlab.com/athenasowl-intern/ao-tv-recording-db-ui.git
# move into the repo
cd ao-tv-recording-db-ui/
# checkout the development branch
git checkout development
# create a virtualenv using python3
virtualenv env -p python3
# activate the virtualenv
source env/bin/activate
# installing pip requirements
pip install -r requirements.txt
# run the webapp
python manage.py runserver 0.0.0.0.:8000
```

#### 3. TODO :- Serve the app from apache
