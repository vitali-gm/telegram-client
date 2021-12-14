import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
// import { Client } from 'tglib';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
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
}
