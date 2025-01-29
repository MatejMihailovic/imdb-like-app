from django.db import models
from accounts.models import UserProfile
from movies.models import Movie

class Review(models.Model):
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
    text = models.TextField()
    date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f'Review by {self.user.user.username} on {self.date}'
