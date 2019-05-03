# Generated by Django 2.1.7 on 2019-05-02 09:43

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='CaptureCard',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('manufacturer', models.CharField(blank=True, max_length=200, verbose_name='Manufacturer')),
                ('model', models.CharField(blank=True, max_length=200, verbose_name='Model')),
                ('identifier', models.CharField(blank=True, max_length=200, verbose_name='Unique Identifier')),
            ],
        ),
        migrations.CreateModel(
            name='System',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ip_address', models.GenericIPAddressField(verbose_name='IP Address')),
                ('username', models.CharField(default='user', max_length=200, verbose_name='SSH Username')),
                ('password', models.CharField(default='12345', max_length=200, verbose_name='SSH Password')),
                ('mac_address', models.CharField(blank=True, max_length=20, verbose_name='MAC Address')),
                ('screenshot', models.ImageField(blank=True, upload_to='screenshots', verbose_name='Last Screenshot')),
                ('netdata_host', models.CharField(blank=True, max_length=200, verbose_name='Netdata Host')),
            ],
        ),
        migrations.CreateModel(
            name='VideoSource',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('source_type', models.CharField(choices=[('Set Top Box', 'Set Top Box'), ('Web Player', 'Web Player'), ('Other', 'Other')], default='Set Top Box', max_length=200, verbose_name='Type')),
                ('manufacturer', models.CharField(blank=True, max_length=200, verbose_name='Manufacturer/Provider')),
                ('model', models.CharField(blank=True, max_length=200, verbose_name='Model')),
                ('identifier', models.CharField(blank=True, max_length=200, verbose_name='Unique Identifier')),
                ('comments', models.CharField(blank=True, max_length=200, verbose_name='Comments')),
            ],
        ),
        migrations.CreateModel(
            name='Node',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('capture_card', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='monitoring.CaptureCard')),
                ('system', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='monitoring.System')),
                ('video_source', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='monitoring.VideoSource')),
            ],
        ),
        migrations.RunSQL('ALTER TABLE `monitoring_capturecard` ADD SYSTEM VERSIONING'),
        migrations.RunSQL('ALTER TABLE `monitoring_system` ADD SYSTEM VERSIONING'),
        migrations.RunSQL('ALTER TABLE `monitoring_videosource` ADD SYSTEM VERSIONING'),
        migrations.RunSQL('ALTER TABLE `monitoring_node` ADD SYSTEM VERSIONING'),
    ]
