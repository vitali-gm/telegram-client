import { Injectable } from '@nestjs/common';
import { Client } from 'tglib';
import { InjectAmqpConnection } from 'nestjs-amqp';
import { Connection } from 'amqplib';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  private readonly client: Client;

  constructor(
    @InjectAmqpConnection()
    private readonly amqp: Connection,
    private readonly configService: ConfigService,
  ) {
    this.client = new Client({
      apiId: this.configService.get<number>('TELEGRAM_API_ID'),
      apiHash: this.configService.get<string>('TELEGRAM_API_HASH'),
      verbosityLevel: 2,
    });
  }

  private async publish(message: string, queue: string) {
    const buf = Buffer.from(message, 'utf8');

    const channel = await this.amqp.createChannel();
    await channel.assertQueue(queue);
    channel.sendToQueue(queue, buf);
  }

  @RabbitSubscribe({
    routingKey: 'telegram_rejoin',
    queue: 'telegram_rejoin',
  })
  public async pubSubHandler(msg: { peer: string; chatId: number }) {
    await this.client.ready;

    let chat = null;

    try {
      const username = msg.peer.split('/').pop();
      chat = await this.client.fetch({
        '@type': 'searchPublicChat',
        username,
      });
    } catch (e) {
      console.log('error', e);
    }

    if (chat !== null) {
      const response = await this.client.fetch({
        '@type': 'joinChat',
        chat_id: chat.id,
      });

      if (response['@type'] === 'ok') {
        await this.publish(msg.chatId.toString(), 'userbot.chat.update');
        console.log(`Received message: `, msg.peer);
      } else {
        console.log(`Failed message: `, msg.peer);
      }
    }

    await this.sleep(60000);

    //todo sleep > 1 min
  }

  async eventUpdate() {
    await this.client.ready;

    console.log(this.client);

    this.client.registerCallback('td:update', async (update) => {
      if (update['@type'] === 'updateChatLastMessage') {
        console.log('[update]', update.last_message);

        const msg = {
          chatId: update.last_message.chat_id,
          date: update.last_message.date,
          message: update.last_message.caption.text ?? '',
          messageId: update.last_message.id,
        };

        await this.publish(JSON.stringify(msg), 'userbot.chat.messages');
        await this.client.fetch({
          '@type': 'readAllChatMentions',
          chat_id: update.last_message.chat_id,
        });
      }
    });
  }

  sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
