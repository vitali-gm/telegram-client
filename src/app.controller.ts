import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { ClientProxy, EventPattern } from '@nestjs/microservices';
// import { Client } from 'tglib';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject('TELEGRAM_SERVICE') private readonly client: ClientProxy,
  ) {}

  @Get()
  getHello(): string {
    this.client.emit('hello', 'Hello result');
    // const client = new Client({
    //   apiId: '9075328',
    //   apiHash: 'a904d865881db19aa0f242929d455e28',
    //   verbosityLevel: 2,
    // });
    //
    // client.ready;
    //
    // console.log(client);
    return this.appService.getHello();
  }
  @EventPattern('hello')
  async h(data: string) {
    console.log('data event', data);
  }
}
