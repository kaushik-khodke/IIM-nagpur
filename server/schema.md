# Tractor Seva - Database Schema

This file documents the current structure of the MySQL database for the Tractor Seva application. Any updates to `server/db.js` must be reflected here.

---

## Tables

### 1. `users`
Stores user credentials and profile details.

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | NO | *None* | Primary Key (UUID string) |
| `name` | `VARCHAR(255)` | NO | *None* | Full name |
| `email` | `VARCHAR(255)` | NO | *None* | Unique email address |
| `password` | `VARCHAR(255)` | NO | *None* | Hashed password |
| `role` | `VARCHAR(50)` | YES | `'user'` | Role (e.g. `'user'`, `'admin'`) |
| `state` | `VARCHAR(100)` | YES | `NULL` | State of residence |
| `phone` | `VARCHAR(20)` | YES | `NULL` | Phone number |
| `bio` | `TEXT` | YES | `NULL` | Short biography |
| `image_path` | `VARCHAR(255)` | YES | `NULL` | Profile photo file path |
| `is_blocked` | `TINYINT(1)` | YES | `0` | Block status (1 for blocked, 0 active) |
| `created_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | Account creation timestamp |

---

### 2. `operators`
Contains listings of machine operators.

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | NO | *None* | Primary Key (UUID string) |
| `user_id` | `VARCHAR(36)` | YES | `NULL` | Foreign Key referencing `users(id)` |
| `name` | `VARCHAR(255)` | NO | *None* | Name of operator |
| `location` | `VARCHAR(255)` | NO | *None* | District |
| `state` | `VARCHAR(100)` | NO | *None* | State |
| `experience` | `INT` | NO | *None* | Years of experience |
| `machine_expertise` | `TEXT` | NO | *None* | Machine expertise details |
| `availability` | `VARCHAR(50)` | YES | `'Available'` | Availability status (e.g. `'Available'`, `'Busy'`) |
| `phone` | `VARCHAR(20)` | YES | `NULL` | Phone number |
| `whatsapp` | `VARCHAR(20)` | YES | `NULL` | WhatsApp number |
| `description` | `TEXT` | YES | `NULL` | Operator description / details |
| `image_path` | `VARCHAR(255)` | YES | `NULL` | Operator photo file path |
| `created_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | Listing creation timestamp |

---

### 3. `harvesters`
Contains listings of harvesting machines.

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | NO | *None* | Primary Key (UUID string) |
| `user_id` | `VARCHAR(36)` | YES | `NULL` | Foreign Key referencing `users(id)` |
| `machine_name` | `VARCHAR(255)` | NO | *None* | Brand & model display name |
| `company` | `VARCHAR(100)` | NO | *None* | Manufacturer name |
| `model` | `VARCHAR(100)` | NO | *None* | Model name |
| `year` | `INT` | YES | `NULL` | Manufacture year |
| `location` | `VARCHAR(255)` | NO | *None* | District |
| `state` | `VARCHAR(100)` | NO | *None* | State |
| `phone` | `VARCHAR(20)` | YES | `NULL` | Contact phone number |
| `description` | `TEXT` | YES | `NULL` | Machine description / details |
| `image_path` | `VARCHAR(255)` | YES | `NULL` | Harvester photo file path |
| `created_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | Listing creation timestamp |

---

### 4. `requests`
Lists seasonal requirements (e.g., operator or harvester wanted).

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | NO | *None* | Primary Key (UUID string) |
| `user_id` | `VARCHAR(36)` | NO | *None* | Foreign Key referencing `users(id)` |
| `type` | `VARCHAR(50)` | NO | *None* | Request type (e.g. `'Harvester Wanted'`, `'Operator Wanted'`) |
| `location` | `VARCHAR(255)` | NO | *None* | District |
| `state` | `VARCHAR(100)` | NO | *None* | State |
| `machine_type` | `VARCHAR(255)` | NO | *None* | Crop harvester type wanted |
| `duration` | `VARCHAR(100)` | YES | `NULL` | Harvesting job duration |
| `start_date` | `DATE` | YES | `NULL` | Proposed job start date |
| `status` | `VARCHAR(50)` | YES | `'Open'` | Request status (e.g. `'Open'`, `'Closed'`) |
| `description` | `TEXT` | YES | `NULL` | Job details / notes |
| `created_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | Post creation timestamp |

---

### 5. `messages`
Stores direct messages sent between users.

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | NO | *None* | Primary Key (UUID string) |
| `sender_id` | `VARCHAR(36)` | NO | *None* | Foreign Key referencing `users(id)` |
| `receiver_id` | `VARCHAR(36)` | NO | *None* | Foreign Key referencing `users(id)` |
| `content` | `TEXT` | NO | *None* | Message text content |
| `created_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | Send timestamp |

---

### 6. `blogs`
Hosts blog articles.

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | *None* | Primary Key (Auto-Increment) |
| `title` | `VARCHAR(255)` | NO | *None* | Blog title |
| `category` | `VARCHAR(100)` | NO | *None* | Category label |
| `short_description` | `TEXT` | NO | *None* | Brief excerpt/description |
| `content` | `TEXT` | NO | *None* | Full article body text |
| `date` | `VARCHAR(50)` | YES | `NULL` | Display date |
| `created_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | Blog creation timestamp |

---

### 7. `blog_likes`
Enforces a one-like-per-user constraint for blog articles.

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | *None* | Primary Key (Auto-Increment) |
| `blog_id` | `INT` | NO | *None* | Foreign Key referencing `blogs(id)` |
| `user_id` | `VARCHAR(36)` | NO | *None* | Mapped to `users(id)` UUID string |
| `created_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | Like timestamp |

**Constraints:**
- UNIQUE KEY `unique_user_blog_like` (`user_id`, `blog_id`)

---

### 8. `blog_comments`
Tracks comment logs on blogs.

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | *None* | Primary Key (Auto-Increment) |
| `blog_id` | `INT` | NO | *None* | Foreign Key referencing `blogs(id)` |
| `user_id` | `VARCHAR(36)` | NO | *None* | Mapped to `users(id)` UUID string |
| `user_name` | `VARCHAR(255)` | NO | *None* | Snapshot username at comment time |
| `content` | `TEXT` | NO | *None* | Comment text body |
| `created_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | Comment creation timestamp |

---

### 9. `enquiries`
Stores farmer and operator enquiries.

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | NO | *None* | Primary Key (UUID string) |
| `name` | `VARCHAR(255)` | NO | *None* | Enquirer's name |
| `phone` | `VARCHAR(20)` | NO | *None* | Contact phone number |
| `location` | `VARCHAR(255)` | NO | *None* | Enquirer's district/location |
| `requirement` | `TEXT` | NO | *None* | Detailed requirements / notes |
| `date_needed` | `DATE` | YES | `NULL` | Target date needed |
| `status` | `VARCHAR(50)` | YES | `'Pending'` | Status (e.g. `'Pending'`, `'In Progress'`, `'Resolved'`) |
| `created_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | Submission timestamp |
