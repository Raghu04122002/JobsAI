from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Application',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('company', models.CharField(max_length=255)),
                ('role', models.CharField(max_length=255)),
                ('status', models.CharField(choices=[('APPLIED', 'Applied'), ('INTERVIEW', 'Interview'), ('REJECTED', 'Rejected'), ('OFFER', 'Offer')], default='APPLIED', max_length=20)),
                ('applied_date', models.DateField()),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='applications', to='accounts.user')),
            ],
            options={'ordering': ['-applied_date', '-created_at']},
        ),
        migrations.AddIndex(
            model_name='application',
            index=models.Index(fields=['user', 'status'], name='applicatio_user_id_2ad9c9_idx'),
        ),
        migrations.AddIndex(
            model_name='application',
            index=models.Index(fields=['user', '-applied_date'], name='applicatio_user_id_800f17_idx'),
        ),
        migrations.AddIndex(
            model_name='application',
            index=models.Index(fields=['company'], name='applicatio_company_33bfc1_idx'),
        ),
    ]
