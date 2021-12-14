import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [
          'amqp://user:password@localhost:5672',
          // 'amqps://xxxekhfz:In8aX-epaDNYeupjlTXXkObSCWPaSNGs@beaver.rmq.cloudamqp.com/xxxekhfz',
        ],
        queue: 'main_queue',
        queueOptions: {
          durable: false,
        },
      },
    },
  );

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await app.listen(() => {
    console.log('Start service');
  });
}
bootstrap();
