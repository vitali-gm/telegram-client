import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    RabbitMQModule.forRoot(RabbitMQModule, {
      exchanges: [
        {
          name: 'exchange1',
          type: 'topic',
        },
      ],
      uri: 'amqp://user:password@localhost:5672',
    }),
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
