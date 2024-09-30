from django.contrib import admin
from django.urls import path
from .views import Register, Account

urlpatterns = [
    # path("user", Login.as_view()),
    path("register", Register.as_view()),
    path("account/<int:pk>", Account.as_view()),
]
