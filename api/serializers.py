from rest_framework import serializers
from .models import UploadPackage, AnalysisSession, NoteOnsetCalculator


class UploadPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadPackage
        fields = ('id', 'username', 'title', 'tempo', 'file', 'session_code')


class AnalysisSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalysisSession
        fields = ('id', 'username', 'title', 'tempo', 'rate',  'wav_data_json',
                  'averager', 'filepath', 'session_code', 'threshold',
                  'note_onsets_json', 'host')


class AnalysisSessionAnalyseSerializer(serializers.ModelSerializer):
    class Meta:
        model = NoteOnsetCalculator # in this case session_code is simpler and can be used to validify
        fields = ('id', 'session_code')


class NoteOnsetCalculatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = NoteOnsetCalculator
        fields = ('id', 'threshold', 'session_code')
