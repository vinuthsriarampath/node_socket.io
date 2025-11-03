import {MessageStatus} from './enums/messageStatusEnum';
import {MessageType} from './enums/messageType';

export interface GroupMessageDto {
  _videoDescription: any;
  _videoError: boolean;
  _videoLoaded:boolean;
  _imgError: boolean;

  _id:string
  senderId: string,
  groupId: string,
  message: string,
  status: MessageStatus,
  type: MessageType,
  read: boolean,
  readAt: Date,
  createdAt: Date,
  updatedAt: Date
}
