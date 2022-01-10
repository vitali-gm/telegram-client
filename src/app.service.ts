import { Injectable, Logger } from '@nestjs/common';
import { Client } from 'tglib';
import { InjectAmqpConnection } from 'nestjs-amqp';
import { Connection } from 'amqplib';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@nestjs/config';
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {DataSource} from "./entities/data-source.entity";
import {UserbotAccount} from "./entities/userbot-account.entity";
import {UserbotChat} from "./entities/userbot-chat.entity";

const USERBOT_ACCOUNT_ID = 4;

@Injectable()
export class AppService {
  private readonly client: Client;

  private readonly logger = new Logger(AppService.name);

  constructor(
    @InjectAmqpConnection()
    private readonly amqp: Connection,
    private readonly configService: ConfigService,
    @InjectRepository(DataSource)
    private dataSourceRepository: Repository<DataSource>,
    @InjectRepository(UserbotAccount)
    private userbotAccountRepository: Repository<UserbotAccount>,
    @InjectRepository(UserbotChat)
    private userbotChatRepository: Repository<UserbotChat>
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

  // @RabbitSubscribe({
  //   routingKey: 'telegram_rejoin',
  //   queue: 'telegram_rejoin',
  // })
  public async pubSubHandler(msg: { peer: string; chatId: number }) {
    await this.client.ready;

    let chat = null;
    const username = msg.peer.split('/').pop();

    try {
      this.logger.log('Start username', username);
      chat = await this.searchChat(username);
    } catch (e) {
      const error = JSON.parse(e.message);
      this.logger.error(e);
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
          this.logger.log(`Received message: ${msg.peer}`);
        } else {
          this.logger.warn(`Failed message: ${msg.peer}`);
        }
      } catch (e) {
        this.logger.error(e);
      }
    }

    await this.sleep(100000);
  }

  async eventUpdate() {
    await this.client.ready;

    this.logger.log(this.client);

    this.client.registerCallback('td:update', async (update) => {
      if (update['@type'] === 'updateChatLastMessage') {
        const data = update.last_message;
        // this.logger.log('[update]', update);

        if (data) {
          let message;

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
              chatId: parseInt(data.chat_id.toString().substring(4)),
              date: data.date,
              message,
              messageId: parseInt(data.id.toString().substring(5)),
            };
            this.logger.log('msg', msg);
            await this.publish(JSON.stringify(msg), 'userbot.chat.messages');
          }
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


  @RabbitSubscribe({
    routingKey: 'telegram_join_chat',
    queue: 'telegram_join_chat',
  })
  public async joinChat(msg: { peer: string; data_source_id: number }) {
    const dataSource = await this.dataSourceRepository.findOne(msg.data_source_id);

    await this.client.ready;

    let chat = null;
    let errMessage = '';

    const username = msg.peer.split('/').pop();

    try {
      this.logger.log('Start username', username);
      chat = await this.searchChat(username);
    } catch (e) {
      const error = JSON.parse(e.message);
      this.logger.error(e);
      if (error.code === 429) {
        await this.sleep(100000);
        chat = await this.searchChat(username);
      }
    }

    if (chat == null) {
      this.logger.warn(`Не удалось подписаться на telegram-чат (peer=${msg.peer})`);
    } else {
      const chatId = parseInt(chat.id.toString().substring(4));

      const userbotChat = await this.userbotChatRepository.findOne({ where: { chatId }});

      console.log('userbotChat', userbotChat);

      if (!userbotChat) {
        const userbotAccount = await this.userbotAccountRepository.findOne(USERBOT_ACCOUNT_ID);

        const newUserbotChat = new UserbotChat();
        newUserbotChat.chatId = chatId;
        newUserbotChat.title = chat.title;
        newUserbotChat.accountId = USERBOT_ACCOUNT_ID;

        await this.userbotChatRepository.save(newUserbotChat);

        userbotAccount.channels += 1;

        await this.userbotAccountRepository.update(USERBOT_ACCOUNT_ID, userbotAccount);
      }

      const checkDataSource = await this.dataSourceRepository.findOne({
        where: {
          typeUid: chatId
        }
      });

      if (!checkDataSource) {
        if (!dataSource) {
          errMessage = 'Источник данных не существует';
        } else {
          dataSource.typeUid = chatId;
          dataSource.status = 'valid';
        }
      } else {
        errMessage = 'Этот telegram-чат уже добавлен как источник данных.';
      }
    }

    if (errMessage !== '') {
      if (dataSource) {
        dataSource.status = 'invalid';
        dataSource.active = 0;
        dataSource.errMsg = errMessage ?? 'Непредвиденная ошибка'
      }
    }

    await this.dataSourceRepository.update(dataSource.id, dataSource);
  }
}
