# QELMORA Database

## Setup

1. Install MySQL 8.0+.
2. Create an application user (recommended):

```sql
CREATE USER 'qelmora_app'@'localhost' IDENTIFIED BY 'change_me';
GRANT ALL PRIVILEGES ON qelmora_store.* TO 'qelmora_app'@'localhost';
FLUSH PRIVILEGES;
```

3. Apply schema and seeds:

```bash
mysql -u root -p < database/001_schema.sql
mysql -u root -p < database/002_seed.sql
```

4. Point `backend/.env` at the same database credentials.

## Migrations

If you already applied the root `schema.sql`, run only the additive statements you need (e.g. `is_new_arrival`, `coupons`, `homepage_banners`, `password_reset_tokens`) or drop and recreate the database in development.
