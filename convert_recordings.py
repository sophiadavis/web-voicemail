import glob
import os.path
import shutil
import subprocess
import sys

UNPROCESSED_DIR = os.path.join(os.getcwd(), 'uploads', 'unprocessed')
PROCESSED_DIR = os.path.join(os.getcwd(), 'uploads', 'processed')

if sys.platform == 'linux' or sys.platform == 'linux2':
    CONVERSION_PROGRAM = 'avconv'
elif sys.platform == 'darwin':
    CONVERSION_PROGRAM = 'ffmpeg'
else:
    CONVERSION_PROGRAM = None


def convert_recording_to_ogg(path):
    command = CONVERSION_PROGRAM + ' -i %s -acodec libvorbis -acodec libvorbis -ac 2 -ab 96k -ar 44100 -b 345k -s 640x360 %s'

    # ffmped accepts mov, mp4, m4a, 3gp, 3g2, mj2 (not sure about avconv)
    path_to_mov = get_file_matching_path_or_none(path + '/*.[Mm][Oo][Vv]')
    path_to_ogg = get_file_matching_path_or_none(path + '/*.[Oo][Gg][Gg]')

    # so conversion program doesn't complain about recreating the file
    os.remove(path_to_ogg)

    if path_to_mov and path_to_ogg:
        command = command % (path_to_mov, path_to_ogg)
        args = command.split()
        subprocess.check_call(args)

    # if sys.platform == 'linux' or sys.platform == 'linux2':
    #     convert = convert % ('avconv', )
    # elif sys.platform == 'darwin':
    #     convert = convert % ('ffmpeg', )


def get_file_matching_path_or_none(path):
    possible_matches = glob.glob(path)
    if possible_matches:
        return possible_matches[0]
    else:
        return None


def move_processed(path):
    local_dir = os.path.split(path)[1]
    shutil.copytree(path, os.path.join(PROCESSED_DIR, local_dir))
    shutil.rmtree(path)


if __name__ == '__main__':
    unprocessed_subdirs = glob.glob(UNPROCESSED_DIR + '/*')
    for path in unprocessed_subdirs:
        print '---- Processing ' + path
        convert_recording_to_ogg(path)
        move_processed(path)
