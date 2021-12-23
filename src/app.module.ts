import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AmqpModule } from 'nestjs-amqp';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
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
