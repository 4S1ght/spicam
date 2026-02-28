# Imports ==============================================================================================================

import sys
import threading
import time
import select
import argparse

from gpiozero import DigitalInputDevice

# Globals ==============================================================================================================

parser = argparse.ArgumentParser()
parser.add_argument('--light-polling', type=int, default=1,   help='Number of seconds between polling the light sensor.')
parser.add_argument('--stdin-polling', type=float, default=0.5, help='Number of seconds between polling the stdin stream.')
argv = parser.parse_args()

GPIO_day_sensor = DigitalInputDevice(24, pull_up=False)
shutdown_event = threading.Event()

# STDIN dispatcher =====================================================================================================

def stdin_reader():

    while not shutdown_event.is_set():
        ready, _, _ = select.select([sys.stdin], [], [], argv.stdin_polling)

        if ready:
            line = sys.stdin.readline()
            (command, *args) = line.strip().split(' ')

            if command == 'led':
                if (args[0] == 'up'): continue
                if (args[0] == 'down'): continue

        if shutdown_event.is_set(): break
        

reader_thread = threading.Thread(target=stdin_reader)
reader_thread.start()

# STDOUT emitter =======================================================================================================

# TODO: add denoise/denoise

def day_sensor():
    while not shutdown_event.is_set():
        print(f'light_level:{abs(GPIO_day_sensor.value-1)}')
        time.sleep(argv.light_polling)

sensor_thread = threading.Thread(target=day_sensor)
sensor_thread.start()

# ======================================================================================================================

try:
    while reader_thread.is_alive() and sensor_thread.is_alive():
        time.sleep(0.1)
except KeyboardInterrupt:
    print("<interrupted>")
    shutdown_event.set()

reader_thread.join()
sensor_thread.join()

