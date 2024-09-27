import requests

body = {
    "username":"halo",
    "email":"gmail@gmail.com",
    "password":"C9@PlW123",
}

resp = requests.post("http://127.0.0.1:8000/user")

print(resp)