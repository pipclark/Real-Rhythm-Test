from django import forms

class UploadFileForm(forms.Form):
    username = forms.CharField(label="Your name",max_length=50)
    title = forms.CharField(max_length=100, required=False)
    tempo = forms.CharField(label="Tempo (only if known)", max_length=3, required=False)
    file = forms.FileField()