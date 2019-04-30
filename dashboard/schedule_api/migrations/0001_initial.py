# Generated by Django 2.1.7 on 2019-04-25 13:33

import datetime
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('monitoring', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Channel',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(blank=True, max_length=255, null=True)),
                ('channel_id', models.CharField(blank=True, max_length=255, null=True)),
                ('logo_url', models.CharField(blank=True, max_length=2000, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='Schedule',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('device_id', models.CharField(max_length=255)),
                ('start_time', models.TimeField()),
                ('stop_time', models.TimeField()),
                ('validity_start', models.DateField(default=datetime.date.today)),
                ('validity_end', models.DateField(default=datetime.date(9999, 12, 31))),
                ('monday', models.BooleanField(default=True)),
                ('tuesday', models.BooleanField(default=True)),
                ('wednesday', models.BooleanField(default=True)),
                ('thursday', models.BooleanField(default=True)),
                ('friday', models.BooleanField(default=True)),
                ('saturday', models.BooleanField(default=True)),
                ('sunday', models.BooleanField(default=True)),
                ('channel_value', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='schedule_api.Channel')),
                ('node', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='monitoring.Node')),
            ],
        ),
    ]