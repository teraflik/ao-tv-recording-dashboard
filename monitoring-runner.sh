#!/bin/bash
EMAIL=''
function sysstat {
echo -e "
Uptime           : `uptime | sed 's/.*up \([^,]*\), .*/\1/'`
Last Reboot Time : `who -b | awk '{print $3,$4}'`
"
CURL=`which curl`
CURL=$?
if [ $CURL != 0 ]
then
	echo "Please install curl!"
	echo "On Debian based systems:"
	echo "sudo apt-get install curl"
else
echo -e ""
fi

FILENAME="health-`hostname`-`date +%y%m%d`-`date +%H%M`.txt"
sysstat > $FILENAME
echo -e "Reported file $FILENAME generated in current directory." $RESULT
if [ "$EMAIL" != '' ] 
then
	STATUS=`which mail`
	if [ "$?" != 0 ] 
	then
		echo "The program 'mail' is currently not installed."
	else
		cat $FILENAME | mail -s "$FILENAME" $EMAIL
	fi
fi
