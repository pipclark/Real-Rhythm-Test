# Generated by Django 3.2.12 on 2022-03-16 11:59

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_alter_analysissession_wav_data_json'),
    ]

    operations = [
        migrations.AlterField(
            model_name='analysissession',
            name='wav_data_json',
            field=models.JSONField(),
        ),
    ]
