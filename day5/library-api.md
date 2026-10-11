# Library Books REST API

This document outlines the REST API design for managing a library's books resource.

## Endpoints

### 1. List all books
- **Method**: `GET`
- **Path**: `/books`
- **Description**: Retrieves a paginated list of all books in the library.
- **Success Status Code**: `200 OK`

### 2. Get a specific book
- **Method**: `GET`
- **Path**: `/books/{id}`
- **Description**: Retrieves the details of a single book by its unique identifier.
- **Success Status Code**: `200 OK`

### 3. Create a new book
- **Method**: `POST`
- **Path**: `/books`
- **Description**: Adds a new book to the library catalog.
- **Example Request Body**: 
  ```json
  {
    "title": "The Pragmatic Programmer",
    "author": "Andrew Hunt",
    "isbn": "978-0135957059",
    "publishedYear": 2019
  }