Using the Dashboard
===================

TV Recording Pipeline can be broken down into two major steps. The first step is to deploy the pipeline on a *Node* to enable it to record TV, and the second step is to monitor the *TV Recording Node*, track progress and identify failures.

The **TV Recording Dashboard** serves the latter, *i.e.* monitoring the pipeline. But in-order for the backend to function, the *Nodes* need to be configured properly at the deployment stage.

Deployment
----------
TV Recording Pipeline can be deployed on any number of Ubuntu (>16.04) machines using the Ansible Playbook at https://gitlab.com/athenasowl-intern/ao-tv-recording-pipeline-deploy. The instructions on how to use it can be found there.

Monitoring
----------
After deployment of pipeline, the Node needs to be onboarded on the **TV Recording Dashboard**. The instructions are available at :doc:`onboarding`.
