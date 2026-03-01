from collections import deque

class BinarySensorDenoise:
    '''Keeps track of a history of binary values and averages them out to 
    denoise the readouts from physical hardware sensors.'''
    
    def __init__(self, window_size=50, threshold=0.9):
        self.window_size = window_size
        self.threshold   = threshold
        self.buffer      = deque(maxlen=window_size)
        self.running_sum = 0

    def update(self, value):
        '''Updates the value history, tracks their sum 
        and calculates the average based on the window size.'''
        value = 1 if value else 0

        # If buffer full, subtract the value that will be removed
        if len(self.buffer) == self.window_size:
            self.running_sum -= self.buffer[0]

        self.buffer.append(value)
        self.running_sum += value

        average = self.running_sum / len(self.buffer)
        return 1 if average > self.threshold else 0