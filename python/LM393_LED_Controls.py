# Imports ==============================================================================================================

import sys
import threading
import time
import select
import argparse

from gpiozero import DigitalInputDevice
from Helpers import BinarySensorDenoise

# Globals ==============================================================================================================

parser = argparse.ArgumentParser()
parser.add_argument('--light-polling',          type=int,   default=1,   help='Number of seconds between polling the light sensor.')
parser.add_argument('--stdin-polling',          type=float, default=0.5, help='Number of seconds between polling the stdin stream.')
parser.add_argument('--light-sensor-threshold', type=float, default=0.2, help='The average percentage of time the light sensor has to report low light for low light signal to be emitted.')
parser.add_argument('--light-sensor-window',    type=int,   default=600, help='The number of sensor measurements to keep track of and calculate the average of.')
argv = parser.parse_args()

shutdown_event = threading.Event()

GPIO_LIGHT_SENSOR = DigitalInputDevice(24, pull_up=False)

# STDIN dispatcher =====================================================================================================

def stdin_reader():

    while not shutdown_event.is_set():
        ready, _, _ = select.select([sys.stdin], [], [], argv.stdin_polling)

        if ready:
            line = sys.stdin.readline()
            (command, *args) = line.strip().split(' ')

            if command == 'led':
                if args[0] == 'up': continue
                if args[0] == 'down': continue

        if shutdown_event.is_set(): break
        

reader_thread = threading.Thread(target=stdin_reader)
reader_thread.start()

# STDOUT emitter =======================================================================================================

def day_sensor():

    history = BinarySensorDenoise(
        window_size = argv.light_sensor_window,
        threshold = argv.light_sensor_threshold
    )

    while not shutdown_event.is_set():
        
        sensor_value = GPIO_LIGHT_SENSOR.value
        smoothed_value = history.update(sensor_value)

        print(f'light_level:{smoothed_value}')
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

