import {MessageStatus} from './enums/messageStatusEnum';

export interface MessageDto {
  _id:string
  senderId: string,
  receiverId: string,
  message: string,
  status: MessageStatus,
  read: boolean,
  readAt: Date,
  createdAt: Date,
  updatedAt: Date
}
