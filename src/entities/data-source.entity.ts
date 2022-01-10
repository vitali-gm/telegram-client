import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";

@Entity('data_source')
export class DataSource {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'source_id' })
  sourceId: number

  @Column()
  type: string

  @Column({ name: 'type_uid' })
  typeUid: number

  @Column()
  url: string

  @Column({ type: 'smallint' })
  active: number

  @Column()
  status: string

  @Column('jsonb')
  settings: any

  @Column({ name: 'error_msg', type: 'text'})
  errMsg: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
