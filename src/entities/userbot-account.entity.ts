import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('userbot_account')
export class UserbotAccount {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'phone_number' })
  phoneNumber: string

  @Column()
  channels: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
