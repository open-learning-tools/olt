# Ralph local LRS notes

Ralph is exposed through Nginx at `http://lrs.localhost`.

This stack runs Ralph with:

- MongoDB storage via `RALPH_RUNSERVER_BACKEND=mongo`
- Basic Auth via `RALPH_RUNSERVER_AUTH_BACKENDS=basic`
- A persistent Ralph app directory mounted at `/app/.ralph`

On first boot, the Compose command creates a Basic Auth user from:

- `RALPH_LRS_USERNAME`
- `RALPH_LRS_EMAIL`
- `RALPH_LRS_PASSWORD`

The created user receives:

- `statements/read`
- `statements/write`

Future xAPI instrumentation should send statements to:

```txt
http://lrs.localhost/xAPI/statements
```

Use HTTP Basic Auth with the Ralph local credentials when posting statements.
