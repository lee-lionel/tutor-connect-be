# Tutors Connect — API

The backend for [Tutors Connect](https://github.com/lee-lionel/tutor-connect-fe):
a tutor portal that puts parents and tutors in touch directly, without an
agency in between.

Express over MongoDB, JWT auth, and role-based permissions.

> **The instance sleeps.** It runs on Render's free tier and spins down after
> about fifteen minutes idle. The first request then takes twenty seconds or
> so while it boots — measured at 21.7s cold against 0.6s warm. The frontend
> pings it on load to hide that.

## The shape of it

Two roles, and each can do a different thing:

- a **parent** posts a request — subjects, level, part of Singapore
- a **tutor** browses the requests and applies to one
- the parent sees who applied and marks the post closed when they've found someone

Roles are enforced server-side, from the verified token. A tutor calling the
create-post route gets a 403 no matter what the client sends.

## Routes

All under `/api`. Everything except sign-up and sign-in needs
`Authorization: Bearer <token>`.

### Users

| Method | Route                | Who        | What                              |
| ------ | -------------------- | ---------- | --------------------------------- |
| `POST` | `/users`             | anyone     | sign up, returns a token          |
| `POST` | `/users/sign-in`     | anyone     | sign in, returns a token          |
| `GET`  | `/users/list-tutors` | signed in  | tutors who made their profile public |
| `GET`  | `/users/getMe/:id`   | signed in  | one profile                       |
| `PUT`  | `/users/update/:id`  | signed in  | edit a profile                    |

### Posts

| Method   | Route                     | Who      | What                        |
| -------- | ------------------------- | -------- | --------------------------- |
| `GET`    | `/posts`                  | signed in | every open request          |
| `GET`    | `/posts/my-posts/:id`     | signed in | a parent's own requests      |
| `POST`   | `/posts/create`           | parent   | post a request              |
| `PUT`    | `/posts/update/:id`       | parent   | mark a tutor found          |
| `DELETE` | `/posts/delete/:id`       | parent   | withdraw a request          |
| `PUT`    | `/posts/tutor-apply/:id`  | tutor    | apply to a request          |

`GET /health` answers `{"status":"ok"}` without touching the database — useful
for a warm-up ping or an uptime check.

The applicant on `tutor-apply` is taken from the token, not the body, so a
tutor cannot apply as somebody else.

## Data

**User** — name, email, password, phoneNumber, role (`parent` | `tutor`),
experience, subjects, levels, location, feedback, showProfile.
Passwords are hashed with bcrypt and the hash is stripped from every response.

**ParentPost** — createdBy, title, subjects, level, location (one of North,
North-East, Central, East, West), applicants, foundTutor.

## Running it

```bash
npm install
cp .env.example .env     # then fill it in
npm start                # or: npx nodemon server.js
```

| Variable       | What it is                                                    |
| -------------- | ------------------------------------------------------------- |
| `DATABASE_URL` | MongoDB connection string                                      |
| `SECRET`       | signing key for the JWTs                                       |
| `PORT`         | defaults to 3005                                               |
| `CORS_ORIGIN`  | the deployed frontend's URL; unset leaves the API open, which is convenient locally and wrong in production |

Seed data for tutors lives in `models/seedData.js` and is commented out in
`server.js` — uncomment the two lines to load it once.

## Layout

```
server.js              app, CORS, health, 404 and error handlers
config/database.js     the Mongo connection
routes/                one file per resource
controllers/           the handlers
middleware/auth.js     requireAuth, and requireRole for the parent/tutor split
models/                the schemas, plus seed data
```
