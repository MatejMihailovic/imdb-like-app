from django.urls import path
from .views import (
    LoadNeo4jDataView,
    LoadQdrantDataView,
    Neo4jContentBasedRecommendationView,
    Neo4jUserBasedRecommendationView,
    Neo4jFollowBasedRecommendationView,
    QdrantContentBasedRecommendationView
)

urlpatterns = [
    path('neo4j/load-data/', LoadNeo4jDataView.as_view(), name='neo4j-load-data'),
    path('qdrant/load-data/', LoadQdrantDataView.as_view(), name='qdrant-load-data'),
    path('neo4j/content-based/<int:movie_id>/', Neo4jContentBasedRecommendationView.as_view(), name='neo4j-content-based-recommendations'),
    path('neo4j/user-based/<str:username>/', Neo4jUserBasedRecommendationView.as_view(), name='neo4j-user-based-recommendations'),
    path('neo4j/follow-based/<str:username>/', Neo4jFollowBasedRecommendationView.as_view(), name='neo4j-follow-based-recommendations'),
    path('qdrant/content-based/<int:movie_id>/', QdrantContentBasedRecommendationView.as_view(), name='qdrant-content-based-recommendations'),
]