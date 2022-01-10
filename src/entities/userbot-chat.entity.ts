import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
