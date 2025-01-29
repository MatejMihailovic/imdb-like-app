from django.db import models
from movies.models import Movie
from accounts.models import UserProfile
from django.utils import timezone

class WatchHistory(models.Model):
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(default=timezone.now)
    rating = models.DecimalField(max_digits=3, decimal_places=2, null=True)

    def __str__(self):
        return f"{self.user.user.username} watched {self.movie.title} on {self.timestamp.strftime('%Y-%m-%d')}"

