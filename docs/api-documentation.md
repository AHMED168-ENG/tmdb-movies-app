# API Documentation

## Base URL
```
http://localhost:8080
```

## Authentication
All endpoints require an API key in the header:
```
x-api-key: your_api_key_here
```

## Movies Endpoints

### GET /movies
Get all movies with filtering, pagination, and search.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `search` (string, optional): Search in title and overview
- `genre` (string, optional): Filter by genre name
- `year` (number, optional): Filter by release year
- `sortBy` (string, optional): Sort field (title, releaseDate, popularity, tmdbVoteAverage)
- `sortOrder` (string, optional): Sort order (asc, desc)

**Example Request:**
```bash
curl -X GET "http://localhost:8080/movies?page=1&limit=10&genre=Action" \
  -H "x-api-key: your_api_key"
```

**Response:**
```json
{
  "success": true,
  "message": "Movies retrieved successfully",
  "data": {
    "data": [
      {
        "id": "507f1f77bcf86cd799439011",
        "tmdbId": 550,
        "title": "Fight Club",
        "overview": "A ticking-time-bomb insomniac...",
        "releaseDate": "1999-10-15T00:00:00.000Z",
        "genres": ["Drama", "Thriller"],
        "tmdbVoteAverage": 8.4,
        "averageRating": 8.2,
        "ratingsCount": 15
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### GET /movies/:id
Get a specific movie by ID.

**Parameters:**
- `id` (string, required): Movie ID

**Example Request:**
```bash
curl -X GET "http://localhost:8080/movies/507f1f77bcf86cd799439011" \
  -H "x-api-key: your_api_key"
```

### POST /movies
Create a new movie.

**Request Body:**
```json
{
  "tmdbId": 550,
  "title": "Fight Club",
  "overview": "A ticking-time-bomb insomniac...",
  "releaseDate": "1999-10-15",
  "genres": ["Drama", "Thriller"],
  "tmdbVoteAverage": 8.4
}
```

### PATCH /movies/:id
Update an existing movie.

**Parameters:**
- `id` (string, required): Movie ID

**Request Body:**
```json
{
  "title": "Updated Title",
  "overview": "Updated overview",
  "genres": ["Updated", "Genres"]
}
```

### DELETE /movies/:id
Delete a movie.

**Parameters:**
- `id` (string, required): Movie ID

### POST /movies/:id/rate
Rate a movie.

**Parameters:**
- `id` (string, required): Movie ID

**Request Body:**
```json
{
  "userId": "user123",
  "rating": 8
}
```

### POST /movies/:id/watchlist
Add movie to watchlist.

**Parameters:**
- `id` (string, required): Movie ID

**Request Body:**
```json
{
  "userId": "user123"
}
```

### DELETE /movies/:id/watchlist
Remove movie from watchlist.

**Parameters:**
- `id` (string, required): Movie ID

**Request Body:**
```json
{
  "userId": "user123"
}
```

### POST /movies/:id/favorites
Add movie to favorites.

**Parameters:**
- `id` (string, required): Movie ID

**Request Body:**
```json
{
  "userId": "user123"
}
```

### DELETE /movies/:id/favorites
Remove movie from favorites.

**Parameters:**
- `id` (string, required): Movie ID

**Request Body:**
```json
{
  "userId": "user123"
}
```

### POST /movies/sync-tmdb
Sync movies from TMDB.

**Query Parameters:**
- `pages` (number, optional): Number of pages to sync (default: 5)

**Example Request:**
```bash
curl -X POST "http://localhost:8080/movies/sync-tmdb?pages=10" \
  -H "x-api-key: your_api_key"
```

## Users Endpoints

### GET /users
Get all users.

**Example Request:**
```bash
curl -X GET "http://localhost:8080/users" \
  -H "x-api-key: your_api_key"
```

### GET /users/:id
Get a specific user by ID.

**Parameters:**
- `id` (string, required): User ID

### GET /users/email/:email
Get a user by email.

**Parameters:**
- `email` (string, required): User email

### POST /users
Create a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

### PATCH /users/:id
Update an existing user.

**Parameters:**
- `id` (string, required): User ID

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

### DELETE /users/:id
Delete a user.

**Parameters:**
- `id` (string, required): User ID

## Error Responses

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400,
  "timestamp": "2023-01-01T00:00:00.000Z",
  "path": "/api/endpoint"
}
```

### Common Error Codes

- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid API key
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Rate Limiting

The API implements rate limiting:
- **Limit**: 100 requests per minute per IP
- **Headers**: Rate limit information is included in response headers

## Caching

The API implements intelligent caching:
- **TTL**: 5 minutes for GET requests
- **Invalidation**: Automatic cache invalidation on data changes
- **Headers**: Cache status included in response headers

## Swagger Documentation

Interactive API documentation is available at:
```
http://localhost:8080/api-docs
```