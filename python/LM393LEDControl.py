# OLD CODE
# This script wil be replaced completely.

from gpiozero import DigitalInputDevice
import time
from collections import deque

sensor = DigitalInputDevice(17, pull_up=False)

WINDOW_SIZE = 10
INTERVAL    = 0.05          # seconds between samples

history   = deque(maxlen=WINDOW_SIZE)
last_state = None
count      = 0

# seed history
for _ in range(WINDOW_SIZE):
    history.append(sensor.value)

try:
    while True:
        # read and store the raw value
        history.append(sensor.value)

        # average over the window
        avg = sum(history) / len(history)
        current_state = 1 if avg > 0.5 else 0

        # only act on state changes
        if current_state != last_state:
            last_state = current_state
            print(f"{count} Sensor {'HIGH' if current_state else 'LOW'} (average)")
            count += 1      # increment after logging

        time.sleep(INTERVAL)

except KeyboardInterrupt:     # graceful exit on Ctrl‑C
    print("\nStopped.")
