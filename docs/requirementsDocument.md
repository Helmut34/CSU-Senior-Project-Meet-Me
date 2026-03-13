### Requirements Document

# Priority is scaled from 1 - 5, 1 being optional and 5 being a critical core component.
## Functional Requirements

[FR_1] User Location Input 
    Type: Functional

    Description: The system must accept user location input via GPS coordinates from all users.

    Rationale: The core component of the program requires user location data in order to calculate a midpoint and find appropriate meeting locations.

    Fit Criterion: Users will be able to allow GPS access. The system validates, processes, and stores coordinates with reverse geocoding to display human-readable addresses.

    Implementation Notes:
    - Browser Geolocation API integration via LocationInput.jsx
    - Nominatim (OpenStreetMap) for reverse geocoding
    - Location stored with latitude, longitude, address, and timestamp
    - LocationMap.jsx displays user location on interactive Leaflet map

    Priority: 5

    Dependencies: None

[FR_2] Midpoint Calculation 
    Type: Functional

    Description: The system calculates the weighted geographical midpoint between all party members' locations using 3D Cartesian coordinate transformation.

    Rationale: The midpoint calculation is the fundamental algorithm for the application's core purpose of finding fair meeting locations.

    Fit Criterion: Given multiple user coordinates, the midpoint calculation accounts for Earth's curvature by converting lat/lon to Cartesian coordinates and back. Supports weighted midpoints where certain users have more influence based on travel preferences.

    Implementation Notes:
    - Weighted geographical midpoint algorithm in midpoint.py
    - Requires minimum 2 members with confirmed locations
    - Travel weight range: 0.1 - 10.0 (default 1.0)
    - Weights normalized to sum to 1.0
    - Midpoint stored on Party model with timestamp

    Priority: 5

    Dependencies: FR_1

[FR_3] Venue Suggestion 
    Type: Functional

    Description: The system suggests nearby venues within a configurable radius of the calculated midpoint using Google Places API.

    Rationale: Users need venue recommendations to facilitate decisions without having to manually search for locations.

    Fit Criterion: The system returns relevant venue results with name, address, rating, price level, opening hours, and coordinates. Default search radius is 2km, configurable from 100m to 50km.

    Implementation Notes:
    - Google Places API integration via googlemaps library
    - Returns: place name, address, rating, user ratings total, lat/lon, price level, opening hours, place ID, venue types
    - Rate limited: 30 venue searches per minute per user

    Priority: 5

    Dependencies: FR_2

[FR_4] Budget Filtering 
    Type: Functional

    Description: The system allows users to specify budget preferences (low, medium, high, any) through the party questionnaire.

    Rationale: Users care about financial constraints and should only see venues within their desired budget range.

    Fit Criterion: Budget preferences are collected via questionnaire and combined across all party members. The most restrictive budget is selected (low > medium > high > any) when matching venues.

    Implementation Notes:
    - Budget field in PartyQuestionnaire model
    - Preference combining algorithm prioritizes restrictive budgets
    - Integrated with venue matching system

    Priority: 3

    Dependencies: FR_3

[FR_6] Distance Constraint Adjustment 
    Type: Functional

    Description: The system allows users to set weighted distance preferences via travel_weight in the questionnaire.

    Rationale: Different users may have different travel preferences. Adjustable weights ensure fair outcomes for all participants.

    Fit Criterion: Users can set travel weight between 0.1-10.0 via questionnaire. Higher weights mean the midpoint shifts closer to that user. Venue search radius configurable from 100m to 50km.

    Implementation Notes:
    - travel_weight field in PartyQuestionnaire
    - Syncs to PartyInvite.midpoint_weight and Party.host_midpoint_weight
    - Used in weighted midpoint calculation

    Priority: 3

    Dependencies: FR_3


[FR_8] Share and Invite Functionality 
    Type: Functional

    Description: The system allows users to create parties and invite friends to coordinate meetups.

    Rationale: Users need an easy way to communicate and coordinate meeting plans with participants.

    Fit Criterion: Users can create parties, invite accepted friends, manage invite responses (accept/decline), and coordinate through the party system.

    Implementation Notes:
    - Party model with host ownership
    - PartyInvite model with status tracking 
    - Only accepted friends can be invited

    Priority: 5

    Dependencies: FR_9

[FR_9] User Authentication 
    Type: Functional, Security

    Description: The system provides user registration and login functionality with secure password storage.

    Rationale: User authentication enables session management, personalization, and secure data storage.

    Fit Criterion: Users can create accounts with email, username, and password. Passwords are hashed with bcrypt. Username validation (3-30 chars, alphanumeric/underscore/hyphen). Email format validation.

    Implementation Notes:
    - Flask-Security for authentication
    - Token-based session management
    - Rate limiting: 3 registrations/hour/IP, 5 login attempts/minute/IP
    - Input validation in validation.py
    - Route protection decorators on all protected endpoints

    Priority: 5

    Dependencies: None

[FR_10] Session Management 
    Type: Functional, Security

    Description: The system maintains user sessions with token-based authentication.

    Rationale: Prevents unauthorized access to user accounts. Protects user privacy and data.

    Fit Criterion: Active session persists via authentication tokens. Protected routes require valid authentication. Session verification on page load.

    Implementation Notes:
    - Flask-Security token authentication
    - /api/auth/me endpoint for session verification
    - Auth-required decorators on protected endpoints

    Priority: 3

    Dependencies: FR_9

[FR_11] Multi-User Meetup Creation 
    Type: Functional

    Description: The system supports creating parties with multiple participants. Users can invite accepted friends to coordinate group meetups.

    Rationale: The core use case requires support for group coordination, not just pairs of users.

    Fit Criterion: Host creates party and invites friends. System tracks all participant locations and calculates group midpoint. Each participant receives invite and can accept/decline.

    Implementation Notes:
    - Party model with host relationship
    - PartyInvite for managing invitations
    - Get pending invites, accept/decline functionality
    - Active party tracking per user
    - Leave party / delete party (if host) functionality

    Priority: 3

    Dependencies: FR_1, FR_9

[FR_12] Venue Information Display 
    Type: Functional

    Description: The system displays venue information including name, address, type, rating, price level, and opening hours.

    Rationale: Users need sufficient information to make decisions about suggested venues.

    Fit Criterion: Venue search returns comprehensive information from Google Places API including place name, address, rating, user ratings count, coordinates, price level, opening status, and venue categories.

    Implementation Notes:
    - Venue data returned from venues.py route
    - Displayed in PartyPage.jsx after midpoint calculation
    - Includes Google Place ID for potential deep linking

    Priority: 3

    Dependencies: FR_3

[FR_13] Preference Questionnaire
    Type: Functional

    Description: The system administers a questionnaire to capture user preferences and match venues to group preferences.

    Rationale: Personalized questionnaires improve suggestion quality and user satisfaction by filtering options.

    Fit Criterion: Questionnaire captures budget, meeting type, food preferences, dietary restrictions, atmosphere, and travel weight. Responses from all party members are combined using smart algorithms.

    Implementation Notes:
    - PartyQuestionnaire model (one per user per party)
    - Budget: low/medium/high/any
    - Meeting type: casual/formal/active/relaxed
    - Food preferences: Array of cuisines (Italian, Mexican, Chinese, etc.)
    - Dietary restrictions: Vegetarian, Vegan, Gluten-Free, Halal, Kosher, etc.
    - Atmosphere: quiet/lively/outdoor/indoor
    - Travel weight: 0.1 - 10.0
    - Preference combining algorithm finds common ground

    Priority: 4

    Dependencies: FR_3

[FR_15] Friend System 
    Type: Functional

    Description: The system allows users to add friends, manage friend requests, and maintain a friends list.

    Rationale: Social connections enable easy party creation and coordination.

    Fit Criterion: Users can send friend requests by email, view pending requests, accept/reject requests, and view friends list.

    Implementation Notes:
    - Friends model with bidirectional relationship
    - Status tracking: pending/accepted
    - Self-addition prevention
    - Duplicate request prevention
    - Only accepted friends can be invited to parties

    Priority: 4

    Dependencies: FR_9

## Look and Feel Requirements

[LF_1] Modern Web Interface Design 
    Type: Look and Feel

    Description: The program features a modern, clean interface using Bootstrap components.

    Rationale: Professional appearance builds user trust and encourages adoption. Consistent design improves usability.

    Fit Criterion: Interface uses consistent Bootstrap 5.3 components. Layout is visually balanced with clear hierarchy of information.

    Implementation Notes:
    - Bootstrap 5.3.8 for styling
    - Lucide React icons
    - Modal-based forms
    - Toast notifications for user feedback

    Priority: 5

    Dependencies: None

[LF_2] Map Layout
    Type: Look and Feel

    Description: The application features an interactive map (Leaflet.js) as a primary interface element with user locations visible.

    Rationale: Visual representation of locations improves user comprehension.

    Fit Criterion: Map displays user location with markers. Map is fully interactive with pan and zoom. Uses OpenStreetMap tiles.

    Implementation Notes:
    - Leaflet 1.9.4 with React-Leaflet
    - OpenStreetMap tile layer
    - LocationMap.jsx component
    - Marker popups with address information

    Priority: 4

    Dependencies: None

[LF_3] Visual Markers 
    Type: Look and Feel

    Description: The application features map markers to display user locations.

    Rationale: Clear visual representation improves usability for all users.

    Fit Criterion: User locations displayed with markers on map.

    Implementation Notes:
    - Basic marker implementation complete

    Priority: 2

    Dependencies: LF_2

## Usability Requirements

[U_1] Responsive Mobile Design 
    Type: Usability

    Description: The application uses Bootstrap for responsive design that adapts to different screen sizes.

    Rationale: Users will often plan meetups from mobile devices.

    Fit Criterion: Application uses Bootstrap responsive classes for layout adaptation.

    Implementation Notes:
    - Bootstrap responsive grid system

    Priority: 3

    Dependencies: None

[U_2] Simple Workflow 
    Type: Usability

    Description: The core meetup creation workflow follows a clear flow: login → add friends → create party → enter location → fill questionnaire → view venues.

    Rationale: Complexity causes user abandonment. Streamlined workflow encourages adoption.

    Fit Criterion: User completes full meetup workflow from login to venue results. Each step has clear next action indicated.

    Implementation Notes:
    - Dashboard provides central hub for all actions
    - PartyPage guides through questionnaire and midpoint calculation
    - Toast notifications provide feedback on actions

    Priority: 5

    Dependencies: None

[U_3] Loading State Feedback 
    Type: Usability

    Description: The system displays loading indicators for operations.

    Rationale: Visual feedback prevents users from repeatedly clicking buttons and improves perceived performance.

    Fit Criterion: Operations display loading states where appropriate.

    Implementation Notes:
    - Toast notifications provide action feedback

    Priority: 3

    Dependencies: None

[U_4] Error Message Clarity 
    Type: Usability

    Description: Error messages are written in plain language and provide guidance on resolution.

    Rationale: Clear, actionable messages enable problem-solving without frustration.

    Fit Criterion: Error messages displayed via toast notifications and alerts. Rate limiting provides clear feedback.

    Implementation Notes:
    - Toast.jsx notification system
    - Alert components for form validation errors
    - Rate limit messages explain retry timing

    Priority: 3

    Dependencies: None

[U_5] Accessibility Compliance ❌
    Type: Accessibility

    Description: The application would meet WCAG accessibility standards.

    Rationale: Accessible applications serve users with disabilities.

    Status: Not specifically implemented/audited

    Priority: 1

    Dependencies: None

[U_6] Intuitive Learning 
    Type: Usability, Learning

    Description: The interface is designed to be self-explanatory with clear labels and logical flow.

    Rationale: Intuitive design reduces overhead to adoption and increases user retention.

    Fit Criterion: UI components have clear labels. Dashboard organizes features logically. Forms guide users through required inputs.

    Priority: 3

    Dependencies: U_2

## Performance Requirements

[P_1] Location Calculation Speed 
    Type: Performance

    Description: The system calculates midpoint efficiently using mathematical algorithms.

    Rationale: Users expect responsive interactions.

    Fit Criterion: Midpoint calculation completes quickly using 3D Cartesian coordinate transformation.

    Implementation Notes:
    - Pure mathematical calculation (no external API calls for midpoint)
    - Weight normalization and validation included

    Priority: 4

    Dependencies: FR_2, FR_3

[P_2] Map Rendering Performance 
    Type: Performance

    Description: The interactive map renders efficiently using Leaflet.js.

    Rationale: Slow map rendering creates poor first impression.

    Fit Criterion: Map loads with tiles from OpenStreetMap CDN. Smooth pan and zoom interactions.

    Priority: 4

    Dependencies: LF_2

[P_3] Database Query Performance 
    Type: Performance

    Description: Database queries use SQLAlchemy ORM with proper indexing.

    Rationale: Scalable performance ensures application remains responsive as user base grows.

    Fit Criterion: PostgreSQL database with SQLAlchemy ORM. Unique constraints on appropriate fields.

    Implementation Notes:
    - PostgreSQL for persistent storage
    - Unique constraints on email, username, friend pairs, party invites, questionnaires
    - Foreign key relationships properly defined

    Priority: 1

    Dependencies: None

## Reliability Requirements

[R_1] API Error Handling 
    Type: Reliability

    Description: The system handles API failures gracefully.

    Rationale: Third-party APIs are not always available. Application must remain usable during issues.

    Fit Criterion: Error responses include user-friendly messages. Application remains responsive on API failures.

    Implementation Notes:
    - Try/catch blocks around API calls
    - Error messages returned to frontend

    Priority: 2

    Dependencies: FR_2, FR_3

## Scalability Requirements

[C_3] High-Density Venue Coverage 
    Type: Scalability

    Description: The system handles venue searches efficiently via Google Places API.

    Rationale: Application must work in both dense urban and sparse rural areas.

    Fit Criterion: Venue search radius configurable from 100m to 50km. Rate limiting prevents API abuse.

    Implementation Notes:
    - Google Places API handles venue density
    - Configurable search radius
    - Rate limiting: 30 searches/minute/user

    Priority: 2

    Dependencies: FR_3

## Security Requirements

[S_1] Password Security 
    Type: Security

    Description: User passwords are hashed using bcrypt.

    Rationale: Protects user accounts from unauthorized access in case of data breach.

    Fit Criterion: Password verification confirms bcrypt hashing. Plaintext password never stored.

    Implementation Notes:
    - Bcrypt password hashing via Flask-Security
    - Password validation: minimum 8 characters

    Priority: 5

    Dependencies: FR_9

[S_2] HTTPS Encryption 
    Type: Security

    Description: All data transmission should use HTTPS in production.

    Rationale: Protects sensitive user data in transit.

    Fit Criterion: TLS encryption in production deployment.

    Implementation Notes:
    - Development runs on localhost
    - HTTPS would be configured at deployment/infrastructure level

    Priority: 4

    Dependencies: None

[S_4] Input Validation and Sanitization 
    Type: Security

    Description: All user inputs are validated to prevent injection attacks.

    Rationale: Input validation is critical defense against common web vulnerabilities.

    Fit Criterion: Email format validation, username format validation, password strength requirements. SQLAlchemy ORM prevents SQL injection.

    Implementation Notes:
    - validation.py contains input validation functions
    - Email regex validation
    - SQLAlchemy parameterized queries

    Priority: 5

    Dependencies: None

[S_5] API Key Protection 
    Type: Security

    Description: Google Maps API key is stored in environment variables.

    Rationale: Exposed API keys allow unauthorized use and billing fraud.

    Fit Criterion: API keys stored via environment variables. Config.py loads from environment.

    Implementation Notes:
    - GOOGLE_MAPS_API_KEY loaded from environment
    - .env file for local development
    - Config class in config.py

    Priority: 4

    Dependencies: None

[S_6] User Privacy and Data Minimization 
    Type: Privacy

    Description: The system collects only location data and user preferences necessary for core functionality.

    Rationale: Users should control what data is collected about them.

    Fit Criterion: Only essential data collected: email, username, location (when shared), preferences (when provided).

    Priority: 2

    Dependencies: None

[S_8] Rate Limiting 
    Type: Security

    Description: The system implements rate limiting to prevent abuse.

    Rationale: Protects against brute force attacks and API abuse.

    Fit Criterion: Registration: 3/hour/IP. Login: 5/minute/IP. Venue search: 30/minute/user. Global: 10,000/day, 1,000/hour.

    Implementation Notes:
    - Flask-Limiter for rate limiting
    - Configured in backend __init__.py

    Priority: 4

    Dependencies: None

## Maintainability and Support Requirements

[M_1] Code Documentation 
    Type: Maintainability and Support

    Description: Code includes comments explaining complex logic.

    Rationale: Documentation enables other developers to understand and maintain code.

    Fit Criterion: Complex algorithms have explanation comments. README includes setup instructions.

    Implementation Notes:
    - Midpoint calculation includes algorithm documentation
    - Route files organized by feature
    - Component-based React architecture

    Priority: 3

    Dependencies: None

## Updated Schedule TODO
    
    3/4/2026 - All Test Cases Done.

    3/17/2026 - User Feedback Document, Project Showcase.

    3/25/2026 - Complete Defense Documentation and Begin Preparing for Presentation.


## Works Cited

Anthropic. (2025). Claude (Sonnet 4.5) [Large language model]. https://claude.ai
