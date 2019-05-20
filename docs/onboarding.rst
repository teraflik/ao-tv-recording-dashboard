Onboarding New Node
===================

If a new recording device is added to the fleet of recording devices, it needs to be properly onboarded on the dashboard. Visit https://recording.athenasowl.tv/admin/monitoring/ and provide the necessary (and optional) configuration details of those devices to save that information in our version-controlled database.

..  figure:: _static/img/onboarding/1_monitoring_admin.png

    Onboarding a new node by using the Monitoring Admin Interface.

Adding Node Details
--------------------
A node comprises of three individual components. The capture card, the video source and the PC itself. Each of these components reside as a separate entry in our database to enable thorough audit of related hardware issues if any.

..  figure:: _static/img/onboarding/2_capture_card_admin.png

    List of Onboarded Capture Cards on Admin Interface.

Start by adding the details of connected Capture Card. Right now we are using either on of BlackMagic Intensity Pro 4K, or BlackMagic Decklink Mini Recorder. Hence, the manufacturer will be BlackMagic. Its ideal to put the S/N of the capture card in the Unique Identifier field.

..  figure:: _static/img/onboarding/3_adding_capture_card.png

    Adding a new capture card.

The next component, Video Source can be similarly added. Select the type of Video Source from *Set Top Box*, *Web Player* or *Other*. Fill up the fields Manufacturer, Model and Unique Identifier. Add comments if required.

..  figure:: _static/img/onboarding/4_adding_video_source.png

    Adding a new Video Source.

..  figure:: _static/img/onboarding/5_adding_system.png

    Onboarding a new node by using the Monitoring Admin Interface.

..  figure:: _static/img/onboarding/6_node_admin.png

    Onboarding a new node by using the Monitoring Admin Interface.

..  figure:: _static/img/onboarding/7_adding_node.png

Onboarding a new node by using the Monitoring Admin Interface.

