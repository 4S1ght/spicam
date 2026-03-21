
export type Language = 'english' | 'polish'

export const english = {

    'home.recorded_on':                                 'Recorded on',
    'home.size':                                        'Size',

    // Login
    'login.subtitle':                                   'Login to the Spicam dashboard.',
    'login.username':                                   'Username',
    'login.password':                                   'Password',
    'login.submit':                                     'Login',

    'settings.title':                                   'Settings',
    'settings.warning':                                 'Please note that these settings are not guarded and a wrong configuration can cause the camera to crash, malfunction or produce errors. Only use these to configure the camera on setup.',

    // Account & sessions
    'settings.account.heading':                         'Account & sessions',
    'settings.account.session_duration':                'Session duration',
    'settings.account.session_duration.desc':           'The amount of time (in minutes) of inactivity after which you\'ll be logged out and need to log back in to gain back the access to the camera dashboard.',

    // Recordings
    'settings.recordings.heading':                      'Recordings',
    'settings.recordings.resolution':                   'Resolution',
    'settings.recordings.resolution.desc':              'Dimensions of video frames used for recordings (width/height)',
    'settings.recordings.resolution.note':              'Smaller resolution will decrease the physical field of view of the camera due to how the raspberry pi sensor cropping works.',
    'settings.recordings.frame_rate':                   'Frame rate',
    'settings.recordings.frame_rate.desc':              'Frame rate of the video recordings.',
    'settings.recordings.duration':                     'Duration',
    'settings.recordings.duration.desc':                'Duration of the video recordings in seconds.',
    'settings.recordings.bitrate':                      'Bitrate',
    'settings.recordings.bitrate.desc':                 'Bitrate of the video recordings. This is a raw value representing actual bits per second.\nHigher value = Higher recording quality at the cost of higher disk usage.',
    'settings.recordings.night_vision':                 'Night vision',
    'settings.recordings.night_vision.desc':            'Settings used for recording at night.',
    'settings.recordings.night_vision.contrast':        'Contrast',
    'settings.recordings.night_vision.contrast.desc':   'The contrast of the night vision video. A higher value means more contrast which will improve the visibility in most cases.',
    'settings.recordings.night_vision.gain':            'Gain',
    'settings.recordings.night_vision.gain.desc':       'The gain of the night vision video. A higher value means the video will appear brighter in the night at the cost of additional noise.',

    // Motion detection
    'settings.motion.heading':                          'Motion detection',
    'settings.motion.resolution':                       'Resolution',
    'settings.motion.resolution.desc':                  'Dimensions of video frames used for detecting motion (width/height)',
    'settings.motion.resolution.note':                  'Smaller resolution will decrease the physical field of view of the camera due to how the raspberry pi sensor cropping works.',
    'settings.motion.frame_rate':                       'Frame rate',
    'settings.motion.frame_rate.desc':                  'The framerate (fps/hertz) of how often a motion detection takes frames and compares them to each other.\nHigher framerate will increase the accuracy of motion detection at increased power consumption.',
    'settings.motion.frame_diff':                       'Frame difference',
    'settings.motion.frame_diff.desc':                  'The minimum and maximum difference between frames to be considered motion.\nHigher minimum threshold makes the camera detect stronger motion, while smaller thresholds detect smaller motion. The maximum threshold is used to prevent detecting large changes in front of the camera such as turning off the lights in a room and falsely detecting motion.',
    'settings.motion.frame_diff.warning':               'Too low minimum threshold will cause the camera to detect motion at random, and too low maximum threshold will prevent legitimate changes from triggering. Do not reconfigure this unless you know what you\'re doing.',

    // Language
    'settings.language.heading':                        'Language',

    // Shared
    'settings.save':                                    'Save',
    'settings.note':                                    'Note:',
    'settings.important':                               'Important:',

    'settings.saved_successfully':                      'Saved successfully',
    'settings.failed_to_load':                          'Failed to load the settings.'

}

export const polish = {

    'home.recorded_on':                                 'Nagrane',
    'home.size':                                        'Rozmiar',

    // Login
    'login.subtitle':                                   'Zaloguj się do panelu Spicam.',
    'login.username':                                   'Nazwa użytkownika',
    'login.password':                                   'Hasło',
    'login.submit':                                     'Zaloguj się',

    'settings.title':                                   'Ustawienia',
    'settings.warning':                                 'Należy pamiętać, że ustawienia te nie są zabezpieczone i nieprawidłowa konfiguracja może spowodować awarię kamery, jej nieprawidłowe działanie lub błędy. Używaj ich wyłącznie podczas wstępnej konfiguracji kamery.',

    // Account & sessions
    'settings.account.heading':                         'Konto i sesje',
    'settings.account.session_duration':                'Czas trwania sesji',
    'settings.account.session_duration.desc':           'Czas (w minutach) bezczynności, po którym nastąpi automatyczne wylogowanie i konieczne będzie ponowne zalogowanie się w celu uzyskania dostępu do panelu kamery.',

    // Recordings
    'settings.recordings.heading':                      'Nagrania',
    'settings.recordings.resolution':                   'Rozdzielczość',
    'settings.recordings.resolution.desc':              'Wymiary klatek wideo używanych podczas nagrywania (szerokość/wysokość)',
    'settings.recordings.resolution.note':              'Mniejsza rozdzielczość zmniejsza fizyczne pole widzenia kamery ze względu na sposób, w jaki działa przycinanie obrazu przez sensor Raspberry Pi.',
    'settings.recordings.frame_rate':                   'Liczba klatek na sekundę',
    'settings.recordings.frame_rate.desc':              'Liczba klatek na sekundę nagrań wideo.',
    'settings.recordings.duration':                     'Czas trwania',
    'settings.recordings.duration.desc':                'Czas trwania nagrań wideo w sekundach.',
    'settings.recordings.bitrate':                      'Bitrate',
    'settings.recordings.bitrate.desc':                 'Bitrate nagrań wideo. Jest to wartość surowa reprezentująca rzeczywistą liczbę bitów na sekundę.\nWyższa wartość = wyższa jakość nagrania kosztem większego zużycia miejsca na dysku.',
    'settings.recordings.night_vision':                 'Noktowizja',
    'settings.recordings.night_vision.desc':            'Ustawienia używane podczas nagrywania w nocy.',
    'settings.recordings.night_vision.contrast':        'Kontrast',
    'settings.recordings.night_vision.contrast.desc':   'Kontrast obrazu noktowizyjnego. Wyższa wartość oznacza większy kontrast, co w większości przypadków poprawia widoczność.',
    'settings.recordings.night_vision.gain':            'Wzmocnienie',
    'settings.recordings.night_vision.gain.desc':       'Wzmocnienie obrazu noktowizyjnego. Wyższa wartość sprawia, że obraz nocny jest jaśniejszy kosztem większego szumu.',

    // Motion detection
    'settings.motion.heading':                          'Wykrywanie ruchu',
    'settings.motion.resolution':                       'Rozdzielczość',
    'settings.motion.resolution.desc':                  'Wymiary klatek wideo używanych do wykrywania ruchu (szerokość/wysokość)',
    'settings.motion.resolution.note':                  'Mniejsza rozdzielczość zmniejsza fizyczne pole widzenia kamery ze względu na sposób, w jaki działa przycinanie obrazu przez sensor Raspberry Pi.',
    'settings.motion.frame_rate':                       'Liczba klatek na sekundę',
    'settings.motion.frame_rate.desc':                  'Częstotliwość (kl./s), z jaką wykrywanie ruchu pobiera i porównuje klatki.\nWyższa częstotliwość zwiększa dokładność wykrywania ruchu kosztem większego zużycia energii.',
    'settings.motion.frame_diff':                       'Różnica między klatkami',
    'settings.motion.frame_diff.desc':                  'Minimalna i maksymalna różnica między klatkami, uznawana za ruch.\nWyższy próg minimalny powoduje wykrywanie silniejszego ruchu, natomiast niższy próg wykrywa słabszy ruch. Próg maksymalny służy do zapobiegania fałszywemu wykrywaniu ruchu spowodowanemu gwałtownymi zmianami obrazu, takimi jak wyłączenie światła w pomieszczeniu.',
    'settings.motion.frame_diff.warning':               'Zbyt niski próg minimalny spowoduje losowe wykrywanie ruchu, natomiast zbyt niski próg maksymalny uniemożliwi wykrycie rzeczywistych zmian. Nie zmieniaj tych ustawień, jeśli nie wiesz, co robisz.',

    // Language
    'settings.language.heading':                        'Język',

    // Shared
    'settings.save':                                    'Zapisz',
    'settings.note':                                    'Uwaga:',
    'settings.important':                               'Ważne:',

    'settings.saved_successfully':                      'Zapisano pomyślnie',
    'settings.failed_to_load':                          'Nie udało się wczytać ustawień.'

}