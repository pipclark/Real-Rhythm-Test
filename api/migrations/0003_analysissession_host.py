# Generated by Django 3.2.12 on 2022-03-15 18:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_auto_20220315_1542'),
    ]

    operations = [
        migrations.AddField(
            model_name='analysissession',
            name='host',
            field=models.CharField(max_length=50, null=True, unique=True),
        ),
    ]
