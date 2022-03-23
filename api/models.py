from django.db import models
import random
import string

def generate_user_code():
    length = 4
    while True:
        session_code = ''.join(random.choices(string.ascii_uppercase, k=length))
        if UploadPackage.objects.filter(session_code=session_code).count() == 0:
            break
    return session_code


# Create your models here.
class UploadPackage(models.Model):
    username = models.CharField(max_length=50)
    title = models.CharField(max_length=100, blank=True)
    tempo = models.CharField(max_length=3, blank=True)
    file = models.FileField()
    session_code = models.CharField(max_length=10, default=generate_user_code, unique=True)


class AnalysisSession(models.Model):
    username = models.CharField(max_length=50)
    title = models.CharField(max_length=100, blank=True)
    tempo = models.CharField(max_length=3, blank=True)
    rate = models.CharField(max_length=6)
    #wav_data_b64 = models.BinaryField()
    wav_data_json = models.JSONField() # an averaged out version of the wave
    averager = models.CharField(max_length=50, null=True) # number it's averaged by
    filepath = models.CharField(max_length=200)
    session_code = models.CharField(max_length=10, default=generate_user_code, unique=True)
    threshold = models.CharField(max_length=100, null=True)
    note_onsets_json = models.JSONField(null=True)

    host = models.CharField(max_length=50, unique=True, null=True)

class NoteOnsetCalculator(models.Model):
    threshold = models.CharField(max_length=100)
    session_code = models.CharField(max_length=10) # just for checking and validifying