-- Bootstrap roles/databases for Conecthus
DO
$$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app')
   THEN
      CREATE ROLE app LOGIN PASSWORD 'app';
   END IF;
END
$$;

DO
$$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_database WHERE datname = 'app')
   THEN
      CREATE DATABASE app OWNER app;
   END IF;
END
$$;
