import {MessageStatus} from './enums/messageStatusEnum';
import {MessageType} from './enums/messageType';

export interface MessageDto {
  _videoDescription: any;
  _videoError: boolean;
  _videoLoaded:boolean;
  _imgError: boolean;
  _id:string
  senderId: string,
  receiverId: string,
  message: string,
  status: MessageStatus,
  type: MessageType,
  read: boolean,
  readAt: Date,
  deleted:boolean,
  createdAt: Date,
  updatedAt: Date
}
