import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AmqpModule } from 'nestjs-amqp';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AmqpModule.forRoot({
      name: 'rabbitmq',
      hostname: process.env.RMQ_HOSTNAME,
      port: parseInt(process.env.RMQ_PORT),
      username: process.env.RMQ_USERNAME,
      password: process.env.RMQ_PASSWORD,
    }),

    RabbitMQModule.forRoot(RabbitMQModule, {
      uri: 'amqp://guest:guest@localhost:5672',
    }),
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
