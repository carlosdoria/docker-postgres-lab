CREATE USER app_user WITH PASSWORD 'app_password';

GRANT ALL PRIVILEGES ON DATABASE docker_postgres_lab TO app_user;

GRANT ALL ON SCHEMA public TO app_user;
