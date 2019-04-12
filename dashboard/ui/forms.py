from django.contrib.auth.forms import AuthenticationForm, UsernameField
from django import forms

class LoginForm(AuthenticationForm):
    """Login Form inherited to add form-control class."""

    username = UsernameField(
        max_length=254,
        widget=forms.TextInput(attrs={'autofocus': True, 'class':'form-control'}),
    )
    password = forms.CharField(
        label="Password",
        strip=False,
        widget=forms.PasswordInput(attrs={'class': 'form-control'}),
    )