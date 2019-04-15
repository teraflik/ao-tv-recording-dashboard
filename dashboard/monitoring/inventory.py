# -*- coding: utf-8 -*-
"""
Methods to monitor and control machines on a local network using SSH.
"""
import logging
import os
import subprocess
from collections import namedtuple
from tempfile import NamedTemporaryFile

import jinja2
import paramiko
from ansible.executor.playbook_executor import PlaybookExecutor
from ansible.inventory.manager import \
    InventoryManager as AnsibleInventoryManager
from ansible.parsing.dataloader import DataLoader
from ansible.vars.manager import VariableManager

logging.basicConfig(level=logging.ERROR, filename="/tmp/monitoring.log",
                    format='%(asctime)s | %(levelname)s | %(message)s', datefmt='%Y-%m-%d %H:%M:%S')


class AnsibleInventoryFile():
    """
    Creates a temporary file to hold the inventory to be used by Ansible.

    Example:
        >>> nodes = [{
                    'ip_address': 192.168.0.1,
                    'username': user
                }]
        >>> inventory_file = AnsibleInventoryFile(nodes)
        >>> print(inventory_file.path)

    Use the `dump()` method to dump the contents of the file to stdout. Use `destroy()` method to delete the file after use.
    """

    def __init__(self,
                 nodes,
                 template=(
                     '[nodes]\n'
                     '{% for node in nodes %}'
                     '{{ node.ip_address }} ansible_user={{ node.username }}\n'
                     '{% endfor %}')
                 ):
        self.nodes = nodes
        self.template = template

        jinja2_template = jinja2.Template(
            self.template, lstrip_blocks=True, trim_blocks=True)
        inventory = jinja2_template.render(nodes=self.nodes)

        self.inventory_file = NamedTemporaryFile(mode='w+t', delete=False)
        self.inventory_file.write(inventory)
        self.inventory_file.close()

    @property
    def path(self):
        """Get the path of inventory file"""
        return self.inventory_file.name

    def dump(self):
        """Prints the contents of inventory file to stdout"""
        try:
            with open(self.inventory_file.name, 'r') as fin:
                print(fin.read())
        except (NameError, FileNotFoundError):
            return None

    def destroy(self):
        """Deletes the temporary file from OS"""
        os.remove(self.inventory_file.name)


class InventoryManager():
    """
    Provides methods to manage remote hosts over SSH.

    Uses :class:`Paramiko.SSHClient` to establish SSH Connection and do stuff like:
        - execute shell commands, or
        - fetch contents of files, or 
        - grab the realtime screenshot.

    This class can be extended to include more methods or to implement specific 
    use-cases.
    """
    log = logging.getLogger(__name__)

    def __init__(self):
        # Suppress security warnings generated by Paramiko SSH Client
        import warnings
        warnings.filterwarnings(action='ignore', module='.*paramiko.*')

    def ansible_run(self, host, username, password, playbook):
        """
        Runs an ansible playbook against the specified remote host.
        Returns 0 if the playbook run was successful.

        Note: The Ansible python API is constanly evolving, and thus the code snippet
        below may not function as intended. For the latest version refer:
        https://docs.ansible.com/ansible/latest/dev_guide/developing_api.html
        """
        Options = namedtuple('Options', ['listtags', 'listtasks', 'listhosts',
                                         'syntax', 'module_path', 'become',
                                         'become_method', 'become_user',
                                         'check', 'diff', 'forks',
                                         'verbosity', 'connection'])
        options = Options(listtags=False, listtasks=False, listhosts=False,
                          syntax=False, module_path=None, become=False,
                          become_method='sudo', become_user='root',
                          check=False, diff=False, forks=100,
                          verbosity=3, connection='ssh')

        nodes = [{
            'ip_address': host,
            'username': username
        }]
        passwords = {
            'conn_pass': password,
            'become_pass': password
        }
        inventory_file = AnsibleInventoryFile(nodes)

        loader = DataLoader()
        inventory = AnsibleInventoryManager(
            loader=loader, sources=inventory_file.path)
        variable_manager = VariableManager(loader=loader, inventory=inventory)

        if not os.path.exists(playbook):
            self.log.error(
                "ansible_run() failed for %s@%s, playbook: %s not found.")
            raise ValueError("Playbook {} not found".format(playbook))

        pbex = PlaybookExecutor(playbooks=[playbook],
                                inventory=inventory,
                                variable_manager=variable_manager,
                                loader=loader,
                                options=options,
                                passwords=passwords)

        results = pbex.run()
        return results

    def ping(self, host, timeout=3):
        """
        Returns True if host `<String>` responds to a ping request within the specified `timeout`.

        Note: a host may not respond to a ping (ICMP) request even if the host name is valid.
        """
        # Building the command. Ex: "ping -c 1 google.com"
        command = ['ping', '-c', '1', host]

        try:
            subprocess.run(command, check=True, timeout=timeout)
            return True
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
            self.log.warning(
                "Failed to ping host: %s with timeout: %d", host, timeout)
            return False

    # TODO: Modify function to not use the linux cat command.
    def get_file_contents(self, host, username, password, file_path):
        """
        Gets the contents of a (text) file from remote host, given the file path.
        Raises `ConnectionError` if SSH Connection is unsuccessful or `OSError` if the file does not exist.
        """
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        try:
            ssh.connect(host, username=username, password=password)
            ssh_stdin, ssh_stdout, ssh_stderr = ssh.exec_command(
                "cat {0}".format(file_path))
        except (paramiko.ssh_exception.SSHException, paramiko.ssh_exception.NoValidConnectionsError) as e:
            self.log.exception(
                "get_file_contents() failed for %s@%s file_path: %s", username, host, file_path)
            raise ConnectionError(e)
        if ssh_stdout.channel.recv_exit_status() > 0:
            error = ssh_stderr.read().decode('utf-8').strip()
            self.log.error("get_file_contents() failed for %s@%s file_path: %s with error: %s",
                           username, host, file_path, error)
            raise OSError(error)

        return ssh_stdout.read().decode('utf-8').strip()

    def get_screengrab(self, host, username, password):
        """
        Captures the full screen of remote host and returns the image as file object. 

        Example:
            >>> inv = InventoryManager()
            >>> f = inv.get_screengrab("192.168.2.35", "user", "12345")
            >>> with open("test.png", "w+b") as image:
                    image.write(f)

        """
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        try:
            ssh.connect(host, username=username, password=password)
            ssh_stdin, ssh_stdout, ssh_stderr = ssh.exec_command(
                "DISPLAY=:0.0 import -window root .shot.png")
            sftp = ssh.open_sftp()
        except (paramiko.ssh_exception.SSHException, paramiko.ssh_exception.NoValidConnectionsError) as e:
            self.log.exception(
                "get_screengrab() failed for %s@%s", username, host)
            raise ConnectionError(e)
        if ssh_stdout.channel.recv_exit_status() > 0:
            error = ssh_stderr.read().decode('utf-8').strip()
            self.log.error(
                "get_screengrab() failed for %s@%s with error: %s", username, host, error)
            raise OSError(error)

        try:
            # ? Sometimes fails to read the whole image. Socket might be getting closed before reading.
            with sftp.open('.shot.png') as image:
                screengrab = image.read()
        except (FileNotFoundError, IOError) as e:
            self.log.exception(
                "get_screengrab() failed for: %s@%s", username, host)
            raise
        finally:
            sftp.close()
        return screengrab

    def run_command(self, host, username, password, command):
        """
        Runs the given command string on remote host.
        Raises `ConnectionError` if SSH Connection is unsuccessful.
        """
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        try:
            ssh.connect(host, username=username, password=password)
            ssh_stdin, ssh_stdout, ssh_stderr = ssh.exec_command(command)
        except (paramiko.ssh_exception.SSHException, paramiko.ssh_exception.NoValidConnectionsError) as e:
            self.log.exception(
                "run_command() failed for %s@%s, command: %s", username, host, command)
            raise ConnectionError(e)
        if ssh_stdout.channel.recv_exit_status() > 0:
            error = ssh_stderr.read().decode('utf-8').strip()
            self.log.error(
                "run_command() failed for %s@%s, command: %s with error: %s", username, host, command, error)
            raise OSError(error)

        return ssh_stdout.read().decode('utf-8').strip()
