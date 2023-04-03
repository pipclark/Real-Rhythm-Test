from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import UploadPackageSerializer, AnalysisSessionSerializer, NoteOnsetCalculatorSerializer, AnalysisSessionAnalyseSerializer
from .models import UploadPackage, AnalysisSession
from .rhythm_analysis import handle_uploaded_file, calculate_note_onsets, generate_rhythm_analysis


class UploadView(APIView):
    serializer_class = UploadPackageSerializer

    def post(self, request):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()
        queryset = UploadPackage.objects.all()  # can use .objects.filter(model property = xyz) to check for existing things

        data = request.data
        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            print('upload valid')
            username = serializer.data.get('username')
            title = serializer.data.get('title')
            tempo = serializer.data.get('tempo')
            # extract data from the file and save it
            wav_data_json, averager, filepath, wav_rate = handle_uploaded_file(data.get('file'))
            print('here')
            # check if user old or new
            host = self.request.session.session_key
            queryset = AnalysisSession.objects.filter(host=host)
            # old user
            if queryset.exists():
                print('old session exists')
                analysis_session = queryset[0]
                analysis_session.username = username
                analysis_session.title = title
                analysis_session.tempo = tempo
                analysis_session.rate = wav_rate
                analysis_session.filepath = filepath
                analysis_session.wav_data_json = wav_data_json
                analysis_session.averager = averager
                analysis_session.wav_data_json = wav_data_json
                analysis_session.note_onsets_json = {}
                analysis_session.save(update_fields=['username', 'title', 'tempo', 'rate',
                                                     'wav_data_json', 'averager', 'filepath', 'note_onsets_json'])
                self.request.session['session_code'] = analysis_session.session_code  # keep old session code
            # new user
            else:
                analysis_session = AnalysisSession(username=username, title=title, tempo=tempo, rate=wav_rate,
                                                   wav_data_json=wav_data_json, averager=averager,
                                                   filepath=filepath, host=host)
                analysis_session.save()
            print(f'session_code = {analysis_session.session_code}')

            return Response(AnalysisSessionSerializer(analysis_session).data, status=status.HTTP_200_OK)
        print('upload not valid')

        return Response({'Bad Request': 'Upload data Invalid'}, status=status.HTTP_400_BAD_REQUEST)


class CalculateNoteOnsets(APIView):
    serializer_class = NoteOnsetCalculatorSerializer

    def post(self, request):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        data = request.data
        serializer = self.serializer_class(data=data)
        print(serializer)
        if serializer.is_valid():
            print('values valid')
            threshold = serializer.data.get('threshold')
            # access analysis session for the wave data
            session_code = serializer.data.get('session_code')

            queryset = AnalysisSession.objects.filter(session_code=session_code)
            # session should be active from upload
            if queryset.exists():
                print("session_code exists")
                analysis_session = queryset[0]
                filepath = analysis_session.filepath
                sample_rate = analysis_session.rate
                averager = analysis_session.averager
                # put it into function for calculating note onsets
                note_onsets_json, show_note_onsets_json = calculate_note_onsets(filepath, threshold, sample_rate, averager)
                # store the note_onsets in the db
                analysis_session.note_onsets_json = note_onsets_json # ADD IN ONCE JSONified
                analysis_session.threshold = threshold
                analysis_session.save(update_fields=['note_onsets_json', 'threshold'])
                return Response({"note_onset_data": show_note_onsets_json,
                                 "note_onsets_obj": note_onsets_json
                                 }, status=status.HTTP_200_OK)
            # no session_code exists
            return Response({'Bad Request': 'Analysis session does not exist'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'Bad Request': 'Data sent invalid'}, status=status.HTTP_400_BAD_REQUEST)


class AnalyseRhythm(APIView):
    serializer_class = AnalysisSessionAnalyseSerializer

    def post(self, request):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        data = request.data
        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            print('serializer valid')
            session_code = serializer.data.get('session_code')
            queryset = AnalysisSession.objects.filter(session_code=session_code)
            analysis_session = queryset[0]
            if queryset.exists(): # session exists
                print('analysis session exists')
                note_onsets_json = analysis_session.note_onsets_json
                if len(note_onsets_json) == 0:
                    return Response(status=status.HTTP_422_UNPROCESSABLE_ENTITY)

                tempo = analysis_session.tempo
                beat_no_json, note_delay_json, bin_mids_json, gauss_fit_json, analysis_summary_text_json = generate_rhythm_analysis(note_onsets_json, tempo)

                return Response({"beatNos": beat_no_json,
                                 "noteDelays": note_delay_json,
                                 "binMidsforGauss": bin_mids_json,
                                 "gaussianFit": gauss_fit_json,
                                 "analysisSummary": analysis_summary_text_json
                                 }, status=status.HTTP_200_OK)

            return Response({'Bad Request': 'Invalid Session'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'Bad Request': 'Data sent invalid'}, status=status.HTTP_400_BAD_REQUEST)