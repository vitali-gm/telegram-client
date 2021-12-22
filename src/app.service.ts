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
    const username = msg.peer.split('/').pop();

    try {
      console.log('Start username', username);
      chat = await this.searchChat(username);
    } catch (e) {
      const error = JSON.parse(e.message);
      console.log(e);
      if (error.code === 429) {
        await this.sleep(100000);
        chat = await this.searchChat(username);
      }
    }

    if (chat !== null) {
      let response = null;
      try {
        response = await this.client.fetch({
          '@type': 'joinChat',
          chat_id: chat.id,
        });

        if (response && response['@type'] === 'ok') {
          await this.publish(msg.chatId.toString(), 'userbot.chat.update');
          console.log(`Received message: `, msg.peer);
        } else {
          console.log(`Failed message: `, msg.peer);
        }
      } catch (e) {
        console.log(e);
      }
    }

    await this.sleep(100000);
  }

  async eventUpdate() {
    await this.client.ready;

    console.log(this.client);

    this.client.registerCallback('td:update', async (update) => {
      if (update['@type'] === 'updateChatLastMessage') {
        const data = update.last_message;
        console.log('[update]', update);

        let message = '';

        switch (data.content['@type']) {
          case 'messageText':
            message = data.content.text.text;
            break;
          case 'messagePhoto':
            message = data.content.caption.text;
            break;
          default:
            message = '';
        }

        if (message !== '') {
          const msg = {
            chatId: data.chat_id,
            date: data.date,
            message,
            messageId: parseInt(data.id.toString().substring(5)),
          };
          console.log('msg', msg);
          await this.publish(JSON.stringify(msg), 'userbot.chat.messages');
        }
      }
    });
  }

  sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private async searchChat(username: string) {
    return await this.client.fetch({
      '@type': 'searchPublicChat',
      username,
    });
  }
}
