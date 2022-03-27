import wavio
import numpy as np
from scipy.signal import find_peaks
from scipy import stats
from scipy.optimize import curve_fit
import matplotlib.pyplot as plt
from math import isclose, pi
import pickle, base64
import json
from pathlib import Path

class peaks:
    def __init__(self, time, index, amp):
        self.time = time
        self.index = index
        self.amp = amp


class notes:
    def __init__(self, time, freq, amp, spacing):
        self.time = time
        self.freq = freq
        self.amp = amp
        self.spacing = spacing


class notesEncoder(json.JSONEncoder):
    def default(self, o):
        return o.__dict__


def encode_numpy(np_array):
    # turn np array into base64 encoded to store in model database
    np_bytes = pickle.dumps(np_array)
    np_base64 = base64.b64encode(np_bytes)
    print('successful encode')

    return np_base64


def decode_numpy(np_b64):
    np_bytes = base64.b64decode(np_b64)
    with open(np_bytes, 'rb') as pickle_data:
        np_array = pickle.load(pickle_data)
    print('successful decode')
    return np_array


def json_numpy(np_array):
    # convert to list for JS (similar to it's arrays)
    np_list = np_array.tolist()
    #print('successfully converted numpy array to json')
    json_object = json.dumps(np_list)
    return json_object


def json_numpy_load(json_object):
    np_list = json.loads(json_object)
    np_array = np.array(np_list['np_list'])
    print('sucessfully loaded numpy array from json')
    return np_array


def average_out_array_positives(np_array, avg_num=1):
    # taking off any data at the end that allows it to be divisible into avg_num
    chopendfrom = len(np_array) % avg_num
    # separate positive and negative parts of the wave so averaging doesn't cancel them out
    np_pos = np.copy(np_array)
    np_pos[np_pos < 0] = 0
    np_pos_avg = np.mean(np_pos[:-chopendfrom].reshape(-1, avg_num), axis=1)
    #np_neg = np.copy(np_array)
    #np_neg[np_neg > 0] = 0
    #np_neg_avg = np.mean(np_neg[:-chopendfrom].reshape(-1, avg_num), axis=1)

    #np_avg = np_neg_avg + np_pos_avg
    # in the end the nicest way to display the data is to take the positive
    return np_pos_avg


def handle_uploaded_file(f):
    # because usual function default method wasn't working
    #if t == '':
    #    t = 0
    storage_path = 'api/static/uploads/'
    # save file
    Path(storage_path).mkdir(parents=True, exist_ok=True) # make storage path if does not exist
    with open(storage_path + f.name, 'wb+') as destination:
        for chunk in f.chunks():  # writing in chunks in case file is huge
            destination.write(chunk)

    wav_data = wavio.read(storage_path + f.name)

    # going to also average it out JS so that react / d3 can render more time for less data points
    averager = 1000
    wave_data_json = json_numpy(average_out_array_positives(wav_data.data, avg_num=averager))

    return wave_data_json, averager, (storage_path + f.name), wav_data.rate


def calculate_note_onsets(filepath, threshold, sample_rate, averager):
    #decode wave data
    wave_data = wavio.read(filepath)
    wave_data = wave_data.data

    #make time data
    time_indist = 40E-3  #ms, indistinguishable time (difference can't be detected) maybe make this a variable parameter in ui
    print('time data set')

    # find threshold
    # averaged data used in JS actually has a different max value so need to rescale the threshold
    averaged_wave_data = average_out_array_positives(wave_data, int(averager))
    threshold_max_fraction = float(threshold)/np.amax(averaged_wave_data)
    print(f'threshold is set at {threshold_max_fraction} of max ampltiude.')
    amplitude_threshold = threshold_function(array=wave_data, fraction=threshold_max_fraction, avg_size=1000)
    print('threshold set')

    highest_f = 2000 # ALSO MAKE THIS AS A VARIABLE IN THE UI
    my_peaks = peaks_over_threshold(wav_array=wave_data, threshold=amplitude_threshold,
                                    sample_rate=float(sample_rate), peak_space=(float(sample_rate)/highest_f))  # positive peaks with minimum spacing of 10 ms (¬88Hz)
    every_peak = peaks_over_threshold(wav_array=wave_data, sample_rate=float(sample_rate),
                                      threshold=min(wave_data.ravel()), peak_space=1)  # every detectable peak, positive and negative
    print('peaks found')
    new_notes = find_note_onsets(peaks=my_peaks, all_peaks=every_peak, threshold=amplitude_threshold,
                                 time_indist=time_indist)
    print('note onsets found')

    # function with 0s and values only where note onset times are
    show_note_onsets = ones_on_note_onsets(new_notes, wave_data, int(sample_rate), np.amax(wave_data)*int(averager))

    show_note_onsets_averaged = average_out_array_positives(show_note_onsets, 1000)

    print('note showing function created')
    #figure out how to json new_notes ( notes class that i made)
    # average out show_note_onsets
    return notesEncoder().encode(new_notes), json_numpy(show_note_onsets_averaged)

def ones_on_note_onsets(new_notes, wave_data, rate, max):
    detect_fn = np.zeros(len(wave_data))
    for n in new_notes.time[1:]: # first note 'detected' always at 0 time
        i = int(round(n * rate))
        detect_fn[i] = abs(max)
    return detect_fn




def peaks_over_threshold(wav_array, threshold, sample_rate, peak_space=1):
    threshold_peaks = peaks([], [], [])
    all_peaks = find_peaks(wav_array.ravel(), height=threshold, distance=peak_space)

    threshold_peaks.amp = all_peaks[1]['peak_heights']
    threshold_peaks.index = all_peaks[0]
    threshold_peaks.time = all_peaks[0] / sample_rate
    return threshold_peaks


def threshold_function(array, fraction, avg_size):
    array = array[array > 0]
    array = np.sort(array)  # sort into descending order
    min_avg = np.mean(array[0:avg_size])
    max_avg = np.mean(array[-avg_size:-1])
    return fraction * (max_avg - min_avg)


def add_notes(peaks, notes, i):
    notes.time.append(peaks.time[i])# = np.append(notes.time, peaks.time[i])
    notes.amp.append(peaks.amp[i])# = np.append(notes.amp, peaks.amp[i])
    notes.spacing.append(notes.time[-1] - notes.time[-2])# = np.append(notes.spacing, notes.time[-1] - notes.time[-2])
    # new_notes.freq = np.append(new_notes.freq, bass_freqs.freq[round(i/f_sample_rate)])
    return notes


def write_over_last_note(peaks, notes, i):
    notes.time[-1] = peaks.time[i]
    notes.amp[-1] = peaks.amp[i]
    notes.spacing[-1] = notes.time[-1] - notes.time[-2]
    return notes


def find_note_onsets(peaks, all_peaks, threshold, time_indist):
    notes_onset = notes([0], [0], [0], [0])
    for i in range(0, len(peaks.amp) - 1):
        ii = find_nearest(all_peaks.time, peaks.time[i])
        # if previous part of wave was not below threshold
        if not all(all_peaks.amp[ii - 25:ii - 5] < threshold):
            continue
        # check for if within a too short time from previous detected note onset
        if peaks.time[i] < notes_onset.time[-1] + time_indist:
            # then check if between them is a sound gap ( below threshold)
            if np.mean(peaks.amp[find_nearest(peaks.time, notes_onset.time[-1]):i]) < threshold:
                # and write over the note_onset as the previous detected note was probably a false start/noise
                notes_onset = write_over_last_note(peaks, notes_onset, i)
            else:
                continue
        # check if the note is in the middle of the same frequency (space between peaks infront and before roughly equal)
        if isclose((peaks.time[i] - peaks.time[i - 1]), (peaks.time[i + 1] - peaks.time[i]), abs_tol=0.002):
            continue
        # if the peak made it through then add it to the onset note list
        notes_onset = add_notes(peaks, notes_onset, i)
        #print(peaks.time[i], peaks.amp[i], np.amax(peaks.amp[i - 5:i]))
    print(f'{len(notes_onset.amp)} note onsets were detected')
    return notes_onset


def find_nearest(array, value):
    array = np.asarray(array)
    idx = (np.abs(array - value)).argmin()
    return idx


def generate_rhythm_analysis(new_notes_json, tempo):
    # convert new_notes_json back to notes object
    new_notes_dict = json.loads(new_notes_json)
    new_notes = notes(new_notes_dict['time'], new_notes_dict['freq'], new_notes_dict['amp'], new_notes_dict['spacing'])

    # find the smallest devisions and estimated Tempo from the note spacings
    Tempo, smallestdivision = estimate_tempo_from_mode(new_notes.spacing)

    # deal with tempo if it was input by a user or not (set to 0)
    user_set_tempo = True
    if tempo == '': # not set by user
        tempo = Tempo # use estiamted value
        user_set_tempo = False
    print(f'user set tempo = {user_set_tempo}')
    tempo = float(tempo)

    # run first pass of rhythm analysis
    tempo, beat_no, time_offset, fit = analyse_rhythm(tempo, new_notes, user_set_tempo, smallestdivision)

    if not user_set_tempo:
        # optimize tempo
        tempo, beat_no, time_offset, fit = optimize_tempo(beat_no, tempo, new_notes, smallestdivision, time_offset, user_set_tempo)

    print('Rhythm Analysis Successful')

    # then do the histogram stuff / distrubition curve and results

    bpb = 4  # beats per bar ALLOW USER TO SET THIS
    real_beat_no, note_delay = generate_rhythm_analysis_data(new_notes, tempo, time_offset, smallestdivision, beat_no, bpb)
    print('Early and Late note plot data generated')

    # histogram data to plot vs note delay
    bin_mids, Gauss_fit, p1, p2 = generate_rhythm_histogram_data(note_delay)
    print('Histogram data generated')

    analysis_summary_text = generate_analysis_summary_text(user_set_tempo, p1, p2, smallestdivision, tempo)
    print('Analysis summary text generated')

    print(type(real_beat_no), type(note_delay), type(bin_mids), type(Gauss_fit), type(p1), type(analysis_summary_text))
    return json_numpy(real_beat_no), json_numpy(note_delay), json_numpy(bin_mids), json_numpy(Gauss_fit), json.dumps(analysis_summary_text)


def generate_rhythm_analysis_data(new_notes, tempo, time_offset, smallestdivision, beat_no, bpb):
    fit_tempo = tempo  # opt_param[1]
    fit_time0 = time_offset
    fit_note_times = []
    for b in beat_no:
        fit_note_times.append(60 / (fit_tempo * smallestdivision) * b)
    beat_offset = round(beat_no[0] / bpb) * bpb + beat_no[0] % bpb # beat the first beat falls on

    beat_no -= beat_offset
    note_delay = new_notes.time[1:] - np.array(fit_note_times)
    # 1) beat_no vs note_delay
    std_dev_of_late_notes = np.std(note_delay[note_delay > 0])
    std_dev_of_early_notes = -np.std(note_delay[note_delay < 0])
    std_dev_of_notes = np.std(note_delay)

    return beat_no, note_delay


def generate_rhythm_histogram_data(note_delay):
    def gaussian(x, A, sigma, mean):
        return A * (1 / (sigma * (2 * pi) ** 0.5)) * np.exp(-0.5 * ((x - mean) / (2 * sigma)) ** 2)  # * assym

    num_bins = int(round((max(note_delay) - min(note_delay)) / 0.01))
    counts, bins = np.histogram(note_delay, num_bins)
    bin_mids = np.array([])
    bin_size = bins[1] - bins[0]
    for i, c in enumerate(counts):
        bin_mids = np.append(bin_mids, bins[i] + bin_size / 2)
        # x_axis = np.linspace(min(note_delay),max(note_delay),len(note_delay))
    Gauss_opt_param, Gauss_covar = curve_fit(gaussian, bin_mids, counts, p0=[1, 0.01, 0],
                                             bounds=((0, 0.001, -1), (1000, 1, 1)))

    p0, p1, p2 = Gauss_opt_param
    Gauss_fit = gaussian(bin_mids, p0, p1, p2)

    return bin_mids, Gauss_fit, p1, p2


def generate_analysis_summary_text(tempo_given, p1, p2, smallestdivision, tempo):
    analysis_type = 'detected'
    if tempo_given:
        analysis_type = 'given'

    avg_timing = 'early'
    avg_feel = 'driving'
    if p2 > 0:
        avg_timing = 'late'
        avg_feel = 'laid back'
    if isclose(p2, 0, abs_tol=0.001):
        avg_timing = 'perfectly on time'
        avg_feel = 'normal or military'
    if p1 < 0.005 and isclose(p2, 0, abs_tol=0.001):
        avg_feel = 'non-human'
    avg_rhythm = 'still sound on time'
    if p1 > 0.03:
        avg_rhythm = 'sound out of time'

    analysis_text = {'analysis_type' :analysis_type,
                     'avg_timing': avg_timing,
                     'avg_feel': avg_feel,
                     'avg_rhythm': avg_rhythm,
                     'std_dev': p1,
                     'mean': p2,
                     'smallest_division': smallestdivision,
                     'tempo': tempo #will be given tempo if it's given
                     }

    return analysis_text

def estimate_tempo_from_mode(note_spacings):
    mode_spacing = stats.mode(
        np.around(note_spacings[2:], 1))  # gives mode (most common) value from note_spacing array after round to 1 dp)
    mode_array = []
    lim = 0.1  # since use 1 dp this should be fine - acceptable error on the mode that you'll accept for calculating average after taking other shorter notes out. lower might make it miss things if you're at eg 0.55 and it rounded to 0.6 above
    for n in note_spacings[2:]:  # making new array with values around that mode
        if mode_spacing[0] - lim <= n < mode_spacing[0] + lim:
            mode_array = np.append(mode_array, n)

    mean_of_mode = np.mean(mode_array)
    # std_dev_of_mode = np.std(mode_array)
    Tempo = 60 / mean_of_mode

    # calculate smallest division (occuring at least 4 times to be sure it's deliberate)
    smallest_division = 1
    for s in [2, 4, 8]:
        n = 0
        perfect_spacing = mean_of_mode / s

        for space in note_spacings[2:]:
            if np.allclose(perfect_spacing, space, rtol=perfect_spacing * 0.1):
                n += 1
        if n > 4:
            smallest_division = s

    # don't want Tempo to be set at some unreasonably higher never used value so:
    while Tempo > 251:
        Tempo /= 2
        smallest_division *= 2

    print(Tempo, smallest_division)
    return Tempo, smallest_division


def analyse_rhythm(tempo, new_notes, user_set_tempo, smallestdivision):
    tempo_error = 0.001
    if not user_set_tempo: # tempo not set by user
        tempo_error = 5
    #print(f'tempo = {tempo}')
    time_0 = 0  # time offset
    Tempo = tempo * smallestdivision
    #print(f'tempo error = {tempo_error}')

    param_bounds_spacing = ((-1, Tempo - tempo_error), (1, Tempo + tempo_error))
    opt_param, covariance = curve_fit(minimize_time_diff, new_notes.time[1:], np.zeros(len(new_notes.time[1:])),
                                      p0=[time_0, Tempo], bounds=param_bounds_spacing)
    tempo = opt_param[1] / smallestdivision
    #print(f'tempo = {tempo}, time offset = {opt_param[0]}')
    fit = minimize_time_diff(new_notes.time[1:], opt_param[0], opt_param[1])
    beat_no = ((new_notes.time[1:] - opt_param[0]) / (60 / opt_param[1]))

    for i, b in enumerate(beat_no):
        beat_no[i] = round(b)

    return tempo, beat_no, opt_param[0], fit


def minimize_time_diff(time, time_0, tempo):
    beat_no = []
    beat_spacing = 60 / tempo
    # first beat depends on time_0
    # beat_no = [time_0/beat_spacing]
    # here time 0 is an offset
    beat_no[0:] = ((time[0:] - time_0) / beat_spacing)

    # round beats to be whole numbers
    for i, b in enumerate(beat_no):
        beat_no[i] = round(b)
    y = []
    for b in beat_no:
        y.append(b * beat_spacing + time_0)
    return y - np.array(time) # can't subtract list from list. time was originally np.array before needing to json format


def minimize_time_diff_fix_tempo(time, time_0):
    beat_no = []
    global Tempo
    beat_spacing = 60 / Tempo

    beat_no[0:] = ((time[0:] - time_0) / beat_spacing)

    # round beats to be whole numbers
    for i, b in enumerate(beat_no):
        beat_no[i] = round(b)

    y = []
    for b in beat_no:
        y.append(b * beat_spacing + time_0)
    return y - time


def linear_fit(x, m, c):
    return m * x + c


def optimize_tempo(beat_no, tempo, new_notes, smallestdivision, time_offset, user_set_tempo):
    start_tempo = tempo
    l = 0
    direction = 1
    min_gauss_width = 1

    while l < 200:
        l += 1
        fit_note_times = []

        for b in beat_no:
            fit_note_times.append(60 / (tempo * smallestdivision) * b + time_offset)
        note_delay = new_notes.time[1:] - np.array(fit_note_times)

        # linear fit to notes early/late from the beat
        opt_param, covariance = curve_fit(linear_fit, beat_no, note_delay, p0=(0, 0),
                                          bounds=((-1000, -1000), (1000, 1000)))

        # distribution of notes early/late to the beat
        num_bins = int(round((max(note_delay) - min(note_delay)) / 0.01))
        counts, bins = np.histogram(note_delay, num_bins)
        bin_mids = np.array([])
        bin_size = bins[1] - bins[0]
        for i, c in enumerate(counts):
            bin_mids = np.append(bin_mids, bins[i] + bin_size / 2)

        #gaussian fit
        Gauss_opt_param, Gauss_covar = curve_fit(gaussian_curve, bin_mids, counts, p0=[1, 0.01, 0],
                                                 bounds=((0, 0.001, -1), (1000, 1, 1)))

        # check if gaussian narrower than best and if the early/late gradient is constant with time
        if Gauss_opt_param[1] < min_gauss_width and abs(opt_param[0]) < 0.00001 and Gauss_opt_param[1]:
            best_tempo = tempo
            min_gauss_width = Gauss_opt_param[1]
            #print(f'new min gaussian width = {Gauss_opt_param[1]}, gaussian mean = {Gauss_opt_param[2]}')
            #print(f'gradient = {opt_param[0]}, y offset = {opt_param[1]}')
        # flip search direction
        if direction == 1 and l == 999:
            l = 1
            direction = -1

        new_tempo = start_tempo + direction * 0.01 * l

        tempo, beat_no, time_offset, fit = analyse_rhythm(new_tempo, new_notes, user_set_tempo, smallestdivision)
        # print(l, direction)

    try:
        print(f'optimum tempo found: {round(best_tempo, 2)}')
        tempo, beat_no, time_offset, fit = analyse_rhythm(best_tempo, new_notes, user_set_tempo, smallestdivision)
    except NameError:  # ie when the minimum gaussian width never increased again and best_tempo was never defined
        print(
            f'No improvement found with in +/- bpm of the calculated tempo, therefore hopefully {start_tempo} is acceptable')

    return tempo, beat_no, time_offset, fit

def linear_fit(x, m, c):
    return m * x + c

def gaussian_curve(x, A, sigma, mean):
    return A * (1/(sigma*(2*pi)**0.5))* np.exp(-0.5*((x-mean)/(2*sigma))**2)


def graph(notes, time, peaks, wave):
    # %% #plot the notes detected
    detect_fn = np.zeros(len(time))
    for n in notes.time:
        i = int(round(n * wave.rate))
        detect_fn[i] = 1
    time1, time2 = 2, 22  # 10.82,11
    i1, i2 = find_nearest(time, time1), find_nearest(time, time2)
    ii1, ii2 = find_nearest(peaks.time, time1), find_nearest(peaks.time, time2)
    # i1,i2 = 0, len(time)#i1, i2 = 98400, 98550 #len(time)
    plt.figure()
    plt.plot(time[i1:i2], wave.data[i1:i2] / max(wave.data))
    plt.plot(time[i1:i2], detect_fn[i1:i2])
    plt.plot(peaks.time[ii1:ii2], peaks.amp[ii1:ii2] / max(peaks.amp), 'x')
    # plt.plot(wav_data_abs[i1:i2]) # make sure this is commented out when you first run the code as it's defined later
    plt.ylabel('Amplitude')
    # plt.xlabel('time (seconds)')
    plt.xlabel('time (s)')
    plt.show



def process_audio_file(f, tempo):
    wav_data = wavio.read(f)
    print('wavio read')
    time_int = 1 / wav_data.rate  # rounding makes time inaccurate of course
    time = np.linspace(0, time_int * (len(wav_data.data) - 1), num=len(
        wav_data.data))  # time axis for wav_data.data. Remember (stop) total time needs a minus one in the calculation
    time_indist = 40E-3  # ms, indistinguishable time
    print('time data set')

    amplitude_threshold = threshold_function(array=wav_data.data, fraction=0.1, avg_size=1000)
    print('threshold set')

    highest_f = 2000
    my_peaks = peaks_over_threshold(wav_array=wav_data, threshold=amplitude_threshold,
                                    peak_space=44100 / highest_f)  # positive peaks with minimum spacing of 10 ms (¬88Hz)
    every_peak = peaks_over_threshold(wav_array=wav_data, threshold=min(wav_data.data.ravel()), peak_space=1)  # every detectable peak, positive and negative
    print('peaks found')

    new_notes = find_note_onsets(peaks=my_peaks, all_peaks=every_peak, threshold=amplitude_threshold,
                                 time_indist=time_indist)
    print('note onsets found')

    # HERE return new_notes data to go to a gui for the user to change threshold and other parameters  the find_note_onsets in javascript (displaying onsets on the data) until theyre happy it's getting most note onsets and not extra shit
    # maybe also make a thing that plays the audio back with eg a clap noise when each note onsets is

    # graph(notes=new_notes, time=time, peaks=my_peaks, wave=wav_data)
    # print('graph plotted')

    # this  stuff will probably need to be in another function that gets called when the user is happy with their notes detected

    tempo_estimate, smallestdivision = estimate_tempo_from_mode(new_notes.spacing)
    # Probably put this part in a function

    tempo, beat_no, time_offset, fit = analyse_rhythm(tempo, new_notes, tempo_estimate, smallestdivision)

    tempo, beat_no, time_offset, fit = optimize_tempo(beat_no, tempo, new_notes, smallestdivision, time_offset)
    # then do the histogram stuff / distrubition curve and results

    print('i worked')
    return new_notes
