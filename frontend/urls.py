from django.urls import path
from .views import index

urlpatterns = [
    path('', index),
    path('upload', index),
    path('analysis-session', index),
    path('session/<str:session_code>', index), # <str: > accept any string after room
    path('results/<str:session_code>', index), 

]