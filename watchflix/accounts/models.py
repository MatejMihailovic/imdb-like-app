from django.db import models
from django.contrib.auth.models import User
    
class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=6, decimal_places=2)

    def __str__(self):
        return self.name

class Feature(models.Model):
    description = models.CharField(max_length=255)
    subscription_plan = models.ForeignKey(SubscriptionPlan, related_name='features', on_delete=models.CASCADE)

    def __str__(self):
        return self.description
    
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    birth_date = models.DateField()
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    subscription_plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True, blank=True)
    is_admin = models.BooleanField(default=False)
    
    def __str__(self):
        return self.user.username
