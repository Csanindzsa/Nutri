# from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, status
from .serializers import UserSerializer
from .models import User

# Create your views here.
class Login(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def post(self, request):
        print("request received")
        serializer = UserSerializer(data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)