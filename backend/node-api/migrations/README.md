# Database Migrations

## PostgreSQL

Run migrations in order:

```bash
psql -U postgres -d paysignal -f migrations/001_initial_schema.sql
psql -U postgres -d paysignal -f migrations/002_auth_schema.sql
```

## Migration Management

For production, use a migration tool like:
- `node-pg-migrate` for PostgreSQL





