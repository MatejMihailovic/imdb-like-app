from django.db import models
from accounts.models import UserProfile

class Genre(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Person(models.Model):
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    birth_year = models.IntegerField()

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Movie(models.Model):
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    release_year = models.IntegerField()
    duration = models.IntegerField(help_text="Duration in minutes")
    synopsis = models.TextField()
    imdb_id = models.CharField(max_length=15)
    genres = models.ManyToManyField(Genre, related_name='movies')
    poster_url = models.URLField(max_length=500, null=True, blank=True)
    avg_rating = models.DecimalField(max_digits=3, decimal_places=2, null=True)

    def __str__(self):
        return self.title

class Actor(Person):
    movies = models.ManyToManyField(Movie, related_name='actors')
    followers = models.ManyToManyField(UserProfile, related_name='followed_actors')

class Director(Person):
    movies = models.ManyToManyField(Movie, related_name='directors')
    followers = models.ManyToManyField(UserProfile, related_name='followed_directors')