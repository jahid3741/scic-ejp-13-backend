# SCIC / EJP-13 Service Booking Backend API Documentation

**Base URL**: `https://servexa.onrender.com/api`

Standardized JSON Response Structures:
- **Success Response**:
  ```json
  {
    "success": true,
    "message": "Human readable summary",
    "data": { ... }
  }
  ```
- **Error Response**:
  ```json
  {
    "success": false,
    "message": "Error description",
    "errorSources": [
      { "path": "field", "message": "Detail message" }
    ]
  }
  ```

**Total Mounted Routes**: 30 Endpoints
- **Auth**: 5 routes (`POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/forgot-password`, `POST /auth/reset-password`)
- **Users**: 4 routes (`GET /users`, `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id`)
- **Categories**: 5 routes (`POST /categories`, `GET /categories`, `GET /categories/:id`, `PATCH /categories/:id`, `DELETE /categories/:id`)
- **Services**: 5 routes (`POST /services`, `GET /services`, `GET /services/:id`, `PATCH /services/:id`, `DELETE /services/:id`)
- **Bookings**: 5 routes (`POST /bookings`, `GET /bookings`, `GET /bookings/:id`, `PATCH /bookings/:id`, `DELETE /bookings/:id`)
- **Reviews**: 5 routes (`POST /reviews`, `GET /reviews`, `GET /reviews/:id`, `PATCH /reviews/:id`, `DELETE /reviews/:id`)
- **Health**: 1 route (`GET /health`)

---

## 1. Authentication Endpoints

### 1.1 User Registration
- **Method**: `POST`
- **URL**: `/auth/register`
- **Auth Required**: No (Public)
- **Description**: Register a new user account. Role is forced to `USER`.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!",
    "phone": "+1234567890",
    "address": "123 Main St"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "id": "u-uuid-1",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "USER",
      "phone": "+1234567890",
      "address": "123 Main St",
      "isDeleted": false,
      "createdAt": "2026-08-11T10:00:00.000Z",
      "updatedAt": "2026-08-11T10:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Validation failure (e.g. invalid email format, short password).
  - `409 Conflict`: Email already exists.

---

### 1.2 User Login
- **Method**: `POST`
- **URL**: `/auth/login`
- **Auth Required**: No (Public)
- **Description**: Authenticate user and issue JWT bearer token.
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User logged in successfully",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "u-uuid-1",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "USER"
      }
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Invalid credentials.

---

### 1.3 Get Current User Profile
- **Method**: `GET`
- **URL**: `/auth/me`
- **Auth Required**: Yes (`Bearer <token>`)
- **Description**: Retrieve current authenticated user profile.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User profile retrieved successfully",
    "data": {
      "id": "u-uuid-1",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "USER",
      "phone": "+1234567890",
      "address": "123 Main St",
      "isDeleted": false
    }
  }
  ```

---

### 1.4 Forgot Password Request
- **Method**: `POST`
- **URL**: `/auth/forgot-password`
- **Auth Required**: No (Public)
- **Description**: Request a password reset link sent via email (powered by Resend API). Always returns generic success response to prevent email enumeration.
- **Request Body**:
  ```json
  {
    "email": "jane@example.com"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "If an account with that email exists, a password reset link has been sent.",
    "data": {}
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Invalid email input.
  - `429 Too Many Requests`: Rate limit exceeded.

---

### 1.5 Reset Password
- **Method**: `POST`
- **URL**: `/auth/reset-password`
- **Auth Required**: No (Public)
- **Description**: Reset user password using the single-use reset token sent to their email.
- **Request Body**:
  ```json
  {
    "token": "7f8a9b...",
    "newPassword": "NewPassword123!"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Password has been reset successfully. Please log in with your new password.",
    "data": {}
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Token is invalid, expired, or already used. Validation error for short new password.
  - `429 Too Many Requests`: Rate limit exceeded.

---

## 2. User Management Endpoints

### 2.1 List All Users
- **Method**: `GET`
- **URL**: `/users`
- **Auth Required**: Yes (ADMIN only)
- **Query Parameters**: `page=1`, `limit=10`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Users retrieved successfully",
    "data": {
      "users": [ ... ],
      "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
    }
  }
  ```

### 2.2 Get User by ID
- **Method**: `GET`
- **URL**: `/users/:id`
- **Auth Required**: Yes (ADMIN or Account Owner)
- **Success Response (200 OK)**: `200 OK` with user details.

### 2.3 Update User
- **Method**: `PATCH`
- **URL**: `/users/:id`
- **Auth Required**: Yes (Account Owner or ADMIN)
- **Request Body**: `{ "name": "Jane Smith", "phone": "+9876543210" }`
- **Success Response (200 OK)**: Updated safe user object.

### 2.4 Soft Delete User
- **Method**: `DELETE`
- **URL**: `/users/:id`
- **Auth Required**: Yes (Account Owner or ADMIN)
- **Success Response (200 OK)**: `200 OK`

---

## 3. Category Endpoints

### 3.1 Create Category
- **Method**: `POST`
- **URL**: `/categories`
- **Auth Required**: Yes (ADMIN only)
- **Request Body**: `{ "name": "Web Services", "description": "Tech services", "icon": "code" }`
- **Success Response (201 Created)**: Category object.

### 3.2 List Categories
- **Method**: `GET`
- **URL**: `/categories`
- **Auth Required**: No (Public)
- **Query Parameters**: `page=1`, `limit=10`, `search=web`
- **Success Response (200 OK)**: Paginated categories.

### 3.3 Get Category by ID
- **Method**: `GET`
- **URL**: `/categories/:id`
- **Auth Required**: No (Public)

### 3.4 Update Category
- **Method**: `PATCH`
- **URL**: `/categories/:id`
- **Auth Required**: Yes (ADMIN only)

### 3.5 Soft Delete Category
- **Method**: `DELETE`
- **URL**: `/categories/:id`
- **Auth Required**: Yes (ADMIN only)

---

## 4. Service Endpoints

### 4.1 Create Service
- **Method**: `POST`
- **URL**: `/services`
- **Auth Required**: Yes (ADMIN only)
- **Request Body**: `{ "name": "Web App Development", "description": "Full stack app", "price": 2500.00, "duration": 120, "categoryId": "<UUID>", "status": "ACTIVE" }`
- **Success Response (201 Created)**: Service object with string price `"2500.00"`.

### 4.2 List Services
- **Method**: `GET`
- **URL**: `/services`
- **Auth Required**: No (Public returns ACTIVE only; Admin can pass token for all)
- **Query Parameters**: `page=1`, `limit=10`, `categoryId=<UUID>`, `status=ACTIVE`, `search=app`, `sortBy=price`, `sortOrder=asc`

### 4.3 Get Service by ID
- **Method**: `GET`
- **URL**: `/services/:id`
- **Auth Required**: No (Public)

### 4.4 Update Service
- **Method**: `PATCH`
- **URL**: `/services/:id`
- **Auth Required**: Yes (ADMIN only)

### 4.5 Soft Delete Service
- **Method**: `DELETE`
- **URL**: `/services/:id`
- **Auth Required**: Yes (ADMIN only)

---

## 5. Booking Endpoints

### 5.1 Create Booking
- **Method**: `POST`
- **URL**: `/bookings`
- **Auth Required**: Yes (AUTHENTICATED USER)
- **Request Body**: `{ "serviceId": "<UUID>", "bookingDate": "2026-08-20T10:00:00.000Z", "notes": "Morning appt" }`
- **Success Response (201 Created)**: Booking object (Status: `PENDING`, `totalAmount`: derived from Service price).

### 5.2 List Bookings
- **Method**: `GET`
- **URL**: `/bookings`
- **Auth Required**: Yes (USER sees own bookings; ADMIN sees all)
- **Query Parameters**: `page=1`, `limit=10`, `status=PENDING`, `serviceId=<UUID>`

### 5.3 Get Booking by ID
- **Method**: `GET`
- **URL**: `/bookings/:id`
- **Auth Required**: Yes (Booking Owner or ADMIN)

### 5.4 Update Booking
- **Method**: `PATCH`
- **URL**: `/bookings/:id`
- **Auth Required**: Yes (Owner or ADMIN)
- **User Allowed**: `bookingDate`, `notes`, `status: "CANCELLED"` (from PENDING).
- **Admin Allowed**: `bookingDate`, `notes`, `status` (`CONFIRMED`, `COMPLETED`, `CANCELLED`), `serviceId`.

### 5.5 Soft Delete Booking
- **Method**: `DELETE`
- **URL**: `/bookings/:id`
- **Auth Required**: Yes (Owner or ADMIN)

---

## 6. Review Endpoints

### 6.1 Create Review
- **Method**: `POST`
- **URL**: `/reviews`
- **Auth Required**: Yes (AUTHENTICATED USER)
- **Business Rule**: User must have a `COMPLETED` booking for the service.
- **Request Body**: `{ "serviceId": "<UUID>", "rating": 5, "comment": "Excellent!" }`
- **Success Response (201 Created)**: Review object.

### 6.2 List Reviews
- **Method**: `GET`
- **URL**: `/reviews`
- **Auth Required**: No (Public)
- **Query Parameters**: `page=1`, `limit=10`, `serviceId=<UUID>`, `rating=5`, `search=excellent`

### 6.3 Get Review by ID
- **Method**: `GET`
- **URL**: `/reviews/:id`
- **Auth Required**: No (Public)

### 6.4 Update Review
- **Method**: `PATCH`
- **URL**: `/reviews/:id`
- **Auth Required**: Yes (Review Owner or ADMIN)

### 6.5 Soft Delete Review
- **Method**: `DELETE`
- **URL**: `/reviews/:id`
- **Auth Required**: Yes (Review Owner or ADMIN)

---

## 7. Health Endpoint

### 7.1 Health Check
- **Method**: `GET`
- **URL**: `/health`
- **Auth Required**: No (Public)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "API is healthy",
    "data": { "environment": "development" }
  }
  ```
