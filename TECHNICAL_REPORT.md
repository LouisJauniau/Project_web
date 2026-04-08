# Technical Report: EventHub Full Stack Project

## 1. Scope and Objective

This report documents the current implementation of the EventHub full stack application. The objective is to describe how the project is built and how it works in practice, focusing on architecture, data model, API behavior, frontend behavior, backend comparison, and runtime configuration.

The document is limited to technical project content. It avoids presentation guidance and grading strategy and concentrates on concrete implementation details.

## 2. System Overview

EventHub is a web application for managing events, participants, and registrations. The core workflow starts with user authentication, then continues with event and participant management, and ends with participant registration to events. A central business rule is enforced in the backend and database: the same participant cannot be registered more than once for the same event. The entity model and registration constraint logic are implemented in [django-backend/events/models.py](django-backend/events/models.py) and [django-backend/events/serializers.py](django-backend/events/serializers.py).

The repository contains three codebases with separate roles. The Django backend is the primary API and the source of authentication and authorization logic. The React frontend is the user-facing interface and communicates with the API over HTTP. The Node.js and Express backend is implemented as a comparative backend to study architectural differences against the Django stack.

The main technologies are Django and Django REST Framework on the primary backend, React with React Router and Context API on the frontend, and Express with PostgreSQL on the comparative backend.

## 3. Architecture and Data Flow

The application follows a client server architecture with clear boundaries between UI, API, and persistence. The frontend sends requests through a centralized API service. When a token exists, it is attached to the Authorization header. The Django REST framework authenticates the token, applies permission checks, executes view or viewset logic, validates data through serializers, and reads or writes data through the ORM.

```text
[Browser]
   |
   | React Router + AuthContext + API service
   v
[React Frontend]
   |
   | HTTP requests with Token header
   v
[Django REST API]
   |  ViewSets + Auth endpoints + permissions
   v
[Django ORM]
   |
   v
[SQLite (local) / PostgreSQL (production)]
```

The Node backend follows a parallel structure with explicit routing and controller layers. It exposes similar entity APIs and stores data in PostgreSQL, but without the same framework-level conventions and auth integration used by Django.

## 4. Django Backend and Database

The Django backend is implemented in the events app and is responsible for resource management, authentication endpoints, permission control, and data integrity. Its main API behavior is defined in [django-backend/events/views.py](django-backend/events/views.py), [django-backend/events/permissions.py](django-backend/events/permissions.py), and [django-backend/events/serializers.py](django-backend/events/serializers.py).

### 4.1 Core Entities and Relationship Model

Three entities are implemented: Event, Participant, and Registration. Event contains the event definition data, including title, description, location, date, and status. Participant contains first name, last name, and an email that is unique across participants. Registration is the join entity linking participant and event references, with creation timestamp metadata.

This design implements the many to many relation between events and participants through an explicit registration table. A participant can be linked to multiple events, and an event can contain multiple participants.

### 4.2 Duplicate Registration Rule

Duplicate registration prevention is enforced in two layers. At application level, the registration serializer checks whether a participant is already registered in the target event and returns a validation error for duplicate attempts, as implemented in [django-backend/events/serializers.py](django-backend/events/serializers.py). At storage level, the registration table includes a unique constraint on the participant and event pair in [django-backend/events/models.py](django-backend/events/models.py). The database constraint guarantees integrity even under concurrent requests.

### 4.3 Business Logic and Query Behavior

Event status is maintained by model logic based on event date. Events in the past are marked completed, while future events are marked upcoming. API filtering supports status and date-based filtering for events, and event or participant filtering for registrations.

### 4.4 Authentication and Authorization

Authentication is token based. The backend provides login, logout, current user inspection, and signup endpoints, and it also provides admin-level user management endpoints. Permission behavior is role sensitive: authenticated users have read access to core resources, while create, update, and delete operations are restricted to staff users. User administration endpoints are staff only.

### 4.5 CRUD and Error Handling

The backend exposes full CRUD behavior for events, participants, and registrations through DRF viewsets. Validation errors, authentication failures, authorization failures, and integrity issues are returned as structured API errors. This gives consistent behavior for both normal workflows and failure scenarios.

## 5. Django API Structure

This section focuses only on the structure of the Django API layer, how endpoints are grouped, and how request processing is organized from routing to response.

### 5.1 URL Organization and Entry Points

At project level, the URL configuration exposes two top-level entries: `/admin/` for the Django administration interface and `/api/` for application API traffic. This is defined in [django-backend/eventhub/urls.py](django-backend/eventhub/urls.py). Inside `/api/`, routing is handled by the events app URL module in [django-backend/events/urls.py](django-backend/events/urls.py).

Inside that API namespace, the structure is split into two concrete branches. Resource endpoints are mounted as `/api/events/`, `/api/participants/`, and `/api/registrations/` through a DRF `DefaultRouter`. Authentication and user management endpoints are mounted under `/api/auth/`, including `/api/auth/login/`, `/api/auth/logout/`, `/api/auth/me/`, `/api/auth/signup/`, `/api/auth/users/`, `/api/auth/users/<id>/promote/`, and `/api/auth/users/<id>/`.

### 5.2 Endpoint Groups and Responsibilities

The resource group exposes standard collection and detail operations for events, participants, and registrations. Because these resources are implemented with model viewsets, each resource follows a uniform REST shape on the same path family: `GET /api/events/` and `POST /api/events/` for collection operations, then `GET`, `PUT`, `PATCH`, and `DELETE` on `/api/events/<id>/`; the same shape is used for participants and registrations.

The authentication group handles session and account operations under `/api/auth/`. Login and signup provide token creation flows, logout invalidates the token, and `/api/auth/me/` returns the authenticated user context used by the frontend session hydration process. The `/api/auth/users/` endpoints are dedicated to staff-level user administration, including listing, creation, promotion, and deletion operations. This grouping matches frontend usage, where AuthContext in [frontend/src/context/AuthContext.jsx](frontend/src/context/AuthContext.jsx) consumes auth endpoints and page modules consume resource endpoints.

### 5.3 Request Processing Pipeline

Each API request follows the same internal sequence. The router resolves the path to a viewset action or API view method. Authentication reads the token from the Authorization header. Permission classes then decide access rights based on user authentication state and staff role. After permission approval, serializers validate input data and transform model instances into response payloads. The view logic finally returns a JSON response with the appropriate status code.

This pipeline is important because it defines where each concern is handled. Identity is handled in authentication classes, access policy is handled in permissions, data correctness is handled in serializers and constraints, and business operations are handled in views and models.

### 5.4 Response Shape and Failure Semantics

The API returns JSON responses for both success and error paths. Success responses return model data or auth payloads, such as token and user data after login. Error responses are consistent with DRF behavior and include validation errors for invalid fields, authentication errors when token data is missing or invalid, permission errors when the user role is insufficient, and integrity-related errors when relational constraints are violated.

From an integration perspective, this consistency is what enables the frontend API service to implement one generic error extraction strategy instead of endpoint-specific error parsing.

## 6. React Frontend

The frontend is a route-driven React application with centralized auth and API access. Routing and protected pages are composed in [frontend/src/App.jsx](frontend/src/App.jsx). It uses page components for major workflows and shared components for navigation, route protection, loading display, and error display.

### 6.1 UI Structure

The main pages are LoginPage, DashboardPage, EventsPage, EventDetailsPage, and ParticipantsPage. Shared components include NavBar, ProtectedRoute, LoadingState, and ErrorState. This structure keeps business flows separated while reusing common behavior across pages.

### 6.2 Authentication State and Route Protection

AuthContext stores the authenticated user, manages token persistence, and performs session hydration on startup by calling the current-user endpoint. If token validation fails, the token is removed and the user is treated as unauthenticated. ProtectedRoute prevents access to application pages until authentication state is known, then redirects unauthenticated users to login.

### 6.3 API Integration and Error Strategy

The frontend uses a centralized API service built on fetch in [frontend/src/services/api.js](frontend/src/services/api.js). It sets the API base URL from environment configuration, appends token headers automatically when available, and handles JSON request and response processing in one place. Error extraction logic produces consistent messages from backend responses and supports both page-level and action-level failure handling.

### 6.4 Role Based Behavior

Role behavior is driven by the `is_staff` field returned by the backend user object. Viewer users can access read-only screens and data, while admin users can perform write operations such as creating and updating events, creating participants, and managing registration actions. UI controls are conditionally rendered by role, and the backend remains the final enforcement point through permissions.

## 7. Node.js Backend and Comparison

The Node.js backend provides an Express implementation of the same domain entities. Its server wiring and middleware chain are in [node-backend/src/app.js](node-backend/src/app.js), while schema initialization is in [node-backend/src/db/initDb.js](node-backend/src/db/initDb.js). It includes route modules, controller modules, PostgreSQL integration, request logging, not-found middleware, and centralized error middleware. Schema initialization includes constraints for unique participant email and unique participant-event registration pairs, and controller logic maps database errors to meaningful HTTP responses.

Compared with Django, the Node backend is more explicit in layering and setup. Routing, validation behavior, and data access logic are manually assembled and therefore more flexible, but this also increases the amount of infrastructure code required for equivalent features. Django provides stronger framework conventions, integrated authentication and permissions, and faster path to complete CRUD resource APIs in this project scope.

From a scalability perspective, both stacks are viable when deployed with appropriate operational configuration. In this project, Django is the primary production path because it is fully integrated with the current frontend authentication and permission model, while Node is used as a comparative implementation.

## 8. Deployment and Runtime Configuration

The production deployment is split across two platforms: the Django backend is hosted on Render and the frontend is hosted on Netlify. The Django backend is configured to run in development and production through environment variables. Runtime behavior includes debug mode control, host and trusted-origin configuration, token authentication defaults, CORS handling, and static file serving through WhiteNoise in production mode, as configured in [django-backend/eventhub/settings.py](django-backend/eventhub/settings.py). The backend build process installs dependencies, collects static assets, and applies migrations via [django-backend/build.sh](django-backend/build.sh).

The frontend is built with React scripts and reads the API target from `REACT_APP_API_BASE_URL`. This allows switching backend targets without code changes across environments.

The Node backend is environment-driven as well, with variables for port, mode, database connection string, and optional schema bootstrap behavior at startup.

Across the project, operational reliability depends on correct migration state, valid database connection configuration, and environment consistency between local and deployed systems. In particular, token authentication configuration, allowed hosts, and CORS settings must match the deployed frontend and backend domains for stable end-to-end behavior.

## 9. Local Development Setup

For local development, run the Django backend and React frontend as the primary stack, and use the Node backend only when testing the comparative implementation. The required Django environment keys are documented in [django-backend/.env.example](django-backend/.env.example).

Create a local Django environment file at `django-backend/.env` and set values for `DEBUG`, `SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `SUPERADMIN_USERNAME`, and `SUPERADMIN_PASSWORD`. The most important local setting is `DEBUG=True`, which enables development mode behavior.

Install and run Django:

```bash
cd django-backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Install and run React frontend:

```bash
cd frontend
npm install
npm start
```

If needed, set `REACT_APP_API_BASE_URL` in the frontend environment to point to the local Django API. By default, the frontend API service already targets `http://127.0.0.1:8000/api` when no override is provided.

Install and run the comparative Node backend:

```bash
cd node-backend
npm install
npm run dev
```

For Node local execution, configure `DATABASE_URL` and other runtime variables according to the Node server configuration and scripts in [node-backend/package.json](node-backend/package.json).