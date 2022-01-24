import {Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn} from "typeorm";
import {UserbotChat} from "./userbot-chat.entity";

@Entity('userbot_message')
export class UserbotMessage {
  @PrimaryColumn()
  id: number

  @Column({ name: 'chat_id', type: 'bigint' })
  chatId: number

  @Column({ name: 'message_id' })
  messageId: number

  @Column( 'jsonb')
  origin: any

  @ManyToOne(
    () => UserbotChat,
    (userbotChat: UserbotChat) => userbotChat.userbotMessages,
    { onDelete: 'CASCADE' }
  )
  @JoinColumn({ name: 'chat_id' })
  public userbotChat: UserbotChat;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
