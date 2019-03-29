import io
import unittest
import unittest.mock

from .inventory import AnsibleInventoryFile, InventoryManager
from .models import Node


class OBSTestCase(unittest.TestCase):
    def setUp(self):
        Node.objects.create(name="Testing Self", ip_address="192.168.2.45", username="user")

    def test_obs_start_recording(self):
        node = Node.objects.get(ip_address="192.168.2.45")
        request = int()
        print(obs_start_recording(request, node.pk).content)

    def test_obs_stop_recording(self):
        node = Node.objects.get(ip_address="192.168.2.45")
        request = int()
        print(obs_stop_recording(request, node.pk).content)

class TestAnsibleInventoryFile(unittest.TestCase):
    def setUp(self):
        self.nodes = [
            {
                'name': 'GCP',
                'ip_address': '35.200.225.73',
                'username': 'raghav.khandelwal'
            }
        ]
        self.inv_file = AnsibleInventoryFile(self.nodes)

    def tearDown(self):
        self.inv_file.destroy()

    @unittest.mock.patch('sys.stdout', new_callable=io.StringIO)
    def test_dump(self, mock_stdout):
        self.inv_file.dump()
        self.assertMultiLineEqual(mock_stdout.getvalue().strip(), "[nodes]\n35.200.225.73 ansible_user=raghav.khandelwal")

class TestInventoryManager(unittest.TestCase):
    def setUp(self):
        self.inv = InventoryManager()

    def test_ansible_run(self):
        self.assertEqual(self.inv.ansible_run("192.168.2.236", "user", "12345", "/home/user/projects/ao-tv-recording-pipeline-deploy/dashboard.yml"), 0)

    def test_ping(self):
        self.assertIn(self.inv.ping("192.168.2.35"), [True, False])
        self.assertIn(self.inv.ping("192.168.2.45"), [True, False])
        self.assertIn(self.inv.ping("192.168.56.32"), [False])
        self.assertEqual(self.inv.ping("teraflik.com"), True)
        self.assertEqual(self.inv.ping("teraflik2.com"), False)

    def test_get_file_contents(self):
        self.assertEqual(self.inv.get_file_contents("192.168.2.35", "user", "12345", "/home/user/scripts/channel_id.txt"), "1")
    
    def test_run_command(self):
        self.assertEqual(self.inv.run_command("192.168.2.35", "user", "12345", "cat /home/user/scripts/channel_id.txt"), "1")