import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AmqpModule } from 'nestjs-amqp';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    AmqpModule.forRoot({
      name: 'rabbitmq',
      hostname: 'localhost',
      port: 5672,
      username: 'user',
      password: 'password',
    }),

    RabbitMQModule.forRoot(RabbitMQModule, {
      uri: 'amqp://user:password@localhost:5672',
    }),
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
