import { Injectable } from '@nestjs/common';
import { AmqpConnection, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Client } from 'tglib';

@Injectable()
export class AppService {
  private client: Client;

  constructor(private readonly amqpConnection: AmqpConnection) {
    this.client = new Client({
      apiId: '9075328',
      apiHash: 'a904d865881db19aa0f242929d455e28',
      verbosityLevel: 2,
    });
  }

  @RabbitSubscribe({
    routingKey: 'telegram_rejoin',
    queue: 'telegram_rejoin',
  })
  public async pubSubHandler(msg) {
    await this.client.ready;

    try {
      // const url = 'https://t.me/dnepr056ua';
      const username = msg.peer.split('/').at(-1);
      const chat = await this.client.fetch({
        '@type': 'searchPublicChat',
        username,
      });

      console.log(chat);
    } catch (e) {
      console.log('error', e);
    }

    // //todo join to chat for chat_id
    // const response = await this.client.fetch({
    //   '@type': 'joinChat',
    //   chat_id: msg.chat_id, //-1001053090640,
    // });
    //
    // if (response['@type'] === 'ok') {
    //   //todo add to queue for update user_bot account
    // }

    // console.log(response);
    console.log(`Received message: `, msg.peer);
  }

  async eventUpdate() {
    await this.client.ready;

    console.log(this.client);

    this.client.registerCallback('td:update', (update) => {
      if (update['@type'] === 'updateChatLastMessage') {
        console.log('[update]', update.last_message);
        this.amqpConnection.publish('exchange1', 'test', { msg: 'test' });
      }
    });
  }
}
