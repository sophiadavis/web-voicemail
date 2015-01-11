import json
import os.path
import requests
from requests.auth import HTTPBasicAuth
import subprocess

GEEKVILLE_BASE_URL = 'http://localhost:3000'
USERNAME = 'pi'
HOST = '192.168.1.20'
TARGET_DIR = '~/'
USERNAME = 'user'
PASSWORD = 'pass'

def scp_dir_from_server(path):
    local_dir = os.path.split(path)[1]
    command = 'scp -r %s@%s:%s %s%s' % (USERNAME, HOST, path, TARGET_DIR, local_dir)
    # scp -r pi@192.168.1.20:/home/pi/example ~/Projects/example
    # subprocess.check_call(command.split())
    print '  --- Successfully executed command: '
    print '       ' + command

def signal_success_to_server(path):
    local_dir = os.path.split(path)[1]
    req = requests.get(GEEKVILLE_BASE_URL + '/transferred/' + local_dir, auth=HTTPBasicAuth(USERNAME, PASSWORD))
    print '  --- Signalling success to server. Server says: ' + req.content + '\n'

if __name__ == '__main__':
    print '\n--- Accessing processed recordings.'
    req = requests.get(GEEKVILLE_BASE_URL + '/processed', auth=HTTPBasicAuth(USERNAME, PASSWORD))
    processed_subdirs = json.loads(req.json())
    # from pudb import set_trace; set_trace()
    for path in processed_subdirs:
        print '\n  --- Processing path: ' + path
        scp_dir_from_server(path)
        signal_success_to_server(path)
