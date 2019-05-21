Onboarding New Node
===================

If a new recording device is added to the fleet of recording devices, it needs to be properly onboarded on the dashboard. Visit https://recording.athenasowl.tv/admin/monitoring/ and provide the necessary (and optional) configuration details of those devices to save that information in our version-controlled database.

..  figure:: _static/img/onboarding/1_monitoring_admin.png

    Fig. 1: Onboarding a new node by using the Monitoring Admin Interface.

Adding Node Details
--------------------
A node comprises of three individual components. The capture card, the video source and the PC itself. Each of these components reside as a separate entry in our database to enable thorough audit of related hardware issues if any.

..  figure:: _static/img/onboarding/2_capture_card_admin.png

    Fig. 2: List of Onboarded Capture Cards on Admin Interface.

Start by adding the details of connected Capture Card. Right now we are using either on of BlackMagic Intensity Pro 4K, or BlackMagic Decklink Mini Recorder. Hence, the manufacturer will be BlackMagic. Its ideal to put the S/N of the capture card in the Unique Identifier field.

..  figure:: _static/img/onboarding/3_adding_capture_card.png

    Fig. 3: Adding a new capture card.

The next component, Video Source can be similarly added. First, select the type of Video Source from *Set Top Box*, *Web Player* or *Other*. Fill up the fields for Manufacturer, Model and Unique Identifier.

..  figure:: _static/img/onboarding/4_adding_video_source.png

    Fig. 4: Adding a new video source.

Finally, the details for the system needs to be added. It includes the IP Address, Operating System (Windows, Linux or MacOS), SSH Credentials (Username and Password) and MAC Address.
The Last Screenshot field stores the screenshot last captured on that system. Netdata Host is hostname to Netdata API endpoint for that System. If Netdata is installed, it usually is ``http://<ip_address>:19999``.
Our dashboard can act as a reverse proxy to redirect requests from ``https://recording.athenasowl.tv/monitoring/netdata/<ip_address>/`` to ``http://<ip_address>:19999``

..  figure:: _static/img/onboarding/5_adding_system.png

    Fig. 5: Adding System details.

After all the sub-components of a Node have been added, its time to group them into under a single Node instance. This can be done under the Node admin Interface, as seen in Fig. 6.

..  figure:: _static/img/onboarding/6_node_admin.png

    Fig. 6: The Node Admin Interface.

Select the entry for Capture Card, Video Source and System that make up the Node from the drop-down menus and press Save.

..  figure:: _static/img/onboarding/7_adding_node.png

    Fig. 7: Selecting components of a Node.