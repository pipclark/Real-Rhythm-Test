# Generated by Django 3.2.12 on 2022-03-17 19:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_alter_analysissession_wav_data_json'),
    ]

    operations = [
        migrations.CreateModel(
            name='NoteOnsetCalculator',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('threshold', models.CharField(max_length=100)),
            ],
        ),
    ]