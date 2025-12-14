import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { ConfigService } from '@nestjs/config';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { DB } from './db';

@Module({
  providers: [
    DatabaseService,
    {
      provide: 'DATABASE',
      useFactory: (configService: ConfigService) => {
        const pool = new Pool({
          host: configService.get<string>('DB_HOST'),
          port: parseInt(configService.get<string>('DB_PORT') ?? '6543', 10),
          user: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),
          ssl: {
            rejectUnauthorized: true,
            ca: configService.get<string>('DB_SSL_CA'),
          },
        });

        // ✅ Set timezone for every new DB connection
        pool.on('connect', async (client) => {
          await client.query(`SET TIME ZONE 'Asia/Manila'`);
        });

        return new Kysely<DB>({
          dialect: new PostgresDialect({ pool }),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['DATABASE', DatabaseService],
})
export class DatabaseModule {}
