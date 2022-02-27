CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


create table mints ("id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY, "mint" varchar, "used" varchar, "trx" varchar, "updatedAt" timestamp with time zone, "createdAt" timestamp with time zone);

