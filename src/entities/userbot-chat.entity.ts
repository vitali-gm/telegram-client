import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { UserbotMessage } from "./userbot-message.entity";

@Entity('userbot_chat')
export class UserbotChat {
  @PrimaryColumn({ name: 'chat_id', type: 'bigint' })
  chatId: number

  @Column({ name: 'source_id' })
  sourceId: number

  @Column()
  title: string

  @Column( { name: 'account_id' })
  accountId: number

  @Column()
  username: string

  @OneToMany(
    () => UserbotMessage,
    (userbotMessage: UserbotMessage) => userbotMessage.userbotChat,
    { cascade: true, onDelete: 'CASCADE' }
  )
  userbotMessages: UserbotMessage[]

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
