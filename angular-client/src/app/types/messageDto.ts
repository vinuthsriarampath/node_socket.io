import {MessageStatus} from './enums/messageStatusEnum';

export interface MessageDto {
  _id:string
  senderId: string,
  receiverId: string,
  message: string,
  status: MessageStatus
  createdAt: Date,
  updatedAt: Date
}
