from django.urls import path
from .views import UploadView, CalculateNoteOnsets, AnalyseRhythm

urlpatterns = [
    #path('session', AnalysisSessionView.as_view()),
    path('upload', UploadView.as_view()),
    path('note-onsets', CalculateNoteOnsets.as_view()),
    path('analyse-rhythm', AnalyseRhythm.as_view()),

]