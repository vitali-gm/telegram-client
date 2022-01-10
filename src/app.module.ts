import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AmqpModule } from 'nestjs-amqp';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "./entities/data-source.entity";
import {UserbotChat} from "./entities/userbot-chat.entity";
import {UserbotAccount} from "./entities/userbot-account.entity";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_HOST'),
        port: configService.get('POSTGRES_PORT'),
        username: configService.get('POSTGRES_USER'),
        password: configService.get('POSTGRES_PASSWORD'),
        database: configService.get('POSTGRES_DB'),
        entities: [
          __dirname + '/**/*.entity{.ts,.js}',
        ],
        synchronize: false,
      })
    }),
    TypeOrmModule.forFeature([DataSource, UserbotChat, UserbotAccount]),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AmqpModule.forRootAsync({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        hostname: config.get('RMQ_HOSTNAME'),
        port: parseInt(config.get('RMQ_PORT')),
        username: config.get('RMQ_USERNAME'),
        password: config.get('RMQ_PASSWORD'),
      }),
    }),

    RabbitMQModule.forRootAsync(RabbitMQModule, {
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get('AMQP_URI'),
        prefetchCount: 1,
      }),
    }),
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
