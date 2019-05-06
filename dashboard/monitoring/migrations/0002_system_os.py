# Generated by Django 2.1.7 on 2019-05-03 12:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('monitoring', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='system',
            name='os',
            field=models.CharField(choices=[(0, 'Windows'), (1, 'Linux'), (2, 'Mac OS')], default=1, max_length=200, verbose_name='Operating System'),
        ),
    ]