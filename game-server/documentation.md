# Game API Documentation

## Overview
This API provides endpoints for interacting with the Trivia Fusion game server. The API is split between two applications:
- **Host Application**: Used by game administrators to create and manage games
- **Player Application**: Used by participants to join games and submit answers

## Base URL
```
/api
```

## Authentication
Host authentication is handled via `hostId` in request bodies. Player authentication is handled via `playerId` in request bodies.

## Host Application Endpoints

### Create Game
Creates a new trivia game instance.

**Endpoint:** `POST /games`

**Request Body:**
```json
{
  "hostId": "string",
  "topics": ["string"]
}
```

**Response:**
```json
{
  "id": "string",
  "hostId": "string",
  "status": "lobby",
  "players": [],
  "currentQuestionIndex": 0,
  "questions": [
    {
      "text": "string",
      "options": ["string"],
      "correctAnswer": 0,
      "timeLimit": 30
    }
  ],
  "createdAt": "string"
}
```

### Start Game
Transitions the game from lobby to in-progress state.

**Endpoint:** `POST /games/:id/start`

**Request Body:**
```json
{
  "hostId": "string"
}
```

**Response:**
```json
{
  "status": "started"
}
```

### Next Question
Advances the game to the next question.

**Endpoint:** `POST /games/:id/next`

**Request Body:**
```json
{
  "hostId": "string"
}
```

**Response:**
```json
{
  "text": "string",
  "options": ["string"],
  "correctAnswer": 0,
  "timeLimit": 30
}
```

### Get Leaderboard
Retrieves the current game leaderboard.

**Endpoint:** `GET /games/:id/leaderboard`

**Response:**
```json
[
  {
    "id": "string",
    "name": "string",
    "score": 0,
    "answers": [
      {
        "questionIndex": 0,
        "answer": "string",
        "timestamp": "string"
      }
    ]
  }
]
```

### End Game
Ends the current game.

**Endpoint:** `POST /games/:id/end`

**Request Body:**
```json
{
  "hostId": "string"
}
```

**Response:**
```json
{
  "status": "ended"
}
```

## Player Application Endpoints

### Join Game
Allows a player to join an existing game in lobby state.

**Endpoint:** `POST /games/:id/join`

**Request Body:**
```json
{
  "playerName": "string"
}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "score": 0,
  "answers": []
}
```

### Get Current Question
Retrieves the current active question.

**Endpoint:** `GET /games/:id/questions`

**Response:**
```json
{
  "text": "string",
  "options": ["string"],
  "correctAnswer": 0,
  "timeLimit": 30
}
```

### Submit Answer
Submits a player's answer to the current question.

**Endpoint:** `POST /games/:id/answer`

**Request Body:**
```json
{
  "playerId": "string",
  "answer": "string"
}
```

**Response:**
```json
{
  "status": "answer recorded"
}
```

## Game States
- `lobby`: Initial state where players can join
- `in-progress`: Active gameplay state
- `ended`: Final state after game completion

## Error Responses
All endpoints may return the following error response:

```json
{
  "error": "string"
}
```

Common HTTP status codes:
- `400`: Bad Request - Invalid input or game state
- `500`: Internal Server Error - Server-side processing error

## Debug Mode
The API includes a debug mode that can be enabled via the `DEBUG_MODE` environment variable. When enabled, the system uses mock questions instead of generating them via OpenAI.

## Notes
- Questions are generated using OpenAI's GPT-4 model in production mode
- Game codes are automatically generated 4-character uppercase alphanumeric strings
- All timestamps are in ISO 8601 format