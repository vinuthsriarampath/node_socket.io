import {CommonModule} from '@angular/common';
import {Component, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, NgZone} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Observable, Subscription, BehaviorSubject} from 'rxjs';
import {UserService} from '../../services/user/user-service';
import {Auth} from '../../services/auth/auth';
import {SocketService} from '../../services/sokcets/socket-service';
import {MessageService} from '../../services/messages/message-service';
import {MessageDto} from '../../types/messageDto';
import {MessageNotification} from '../../types/message_notification';
import {FileService} from '../../services/file/file-service';
import {GroupService} from '../../services/group/group-service';
import {GroupDto} from '../../types/groupDto';
import {GroupMessageService} from '../../services/group-messages/group-message-service';
import {GroupMessageDto} from '../../types/groupMessageDto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit, OnDestroy {
  users$!: Observable<any[]>;
  currentUserId = '';

  private readonly selectedUserSubject = new BehaviorSubject<any | null>(null);
  selectedUser$ = this.selectedUserSubject.asObservable();

  private readonly selectedGroupSubject = new BehaviorSubject<GroupDto | null>(null);
  selectedGroup$ = this.selectedGroupSubject.asObservable();

  private readonly messagesSubject = new BehaviorSubject<MessageDto[]>([]);
  messages$ = this.messagesSubject.asObservable();

  private readonly groupMessageSubject = new BehaviorSubject<GroupMessageDto[]>([]);
  groupMessage$ = this.groupMessageSubject.asObservable();

  messageText = '';
  private messageSub!: Subscription;
  private groupMessageSub!: Subscription;

  isTyping = false;
  typingUserId: string | null = null;
  typingTimeout: any;

  notifications: MessageNotification[] = [];
  unreadCounts = new Map<string, number>();

  loadingOlder = false;

  groups: GroupDto[] = [];
  showGroupModal = false;
  newGroupName = '';
  selectedMembers = new Set<string>();

  showVideoPopup = false;
  activeVideoSrc: string | null = null;

  private pendingMedia: number = 0;
  private readonly prevScrollHeight: number = 0;
  protected readonly window = window;

  protected menuMessage:MessageDto | GroupMessageDto | null = null;
  protected messageMenuOpen:boolean = false;
  protected messageMenuX:number | null = null;
  protected messageMenuY:number | null = null;
  protected messageMenuFlip:boolean = false;
  protected isEditingMessage:boolean =false;
  protected originalEditingMessage:MessageDto | GroupMessageDto | null = null;
  protected readonly Date = Date;

  constructor(
    private readonly userService: UserService,
    private readonly authService: Auth,
    protected readonly socketService: SocketService,
    private readonly messageService: MessageService,
    private readonly groupService: GroupService,
    private readonly groupMessageService: GroupMessageService,
    private readonly fileService: FileService,
    private readonly cdr: ChangeDetectorRef,
    private readonly zone: NgZone
  ) {
  }

  ngOnInit() {
    this.users$ = this.userService.getAllUsersExceptMe();

    this.userService.getCurrentUser().subscribe(user => {
      this.currentUserId = user.id;
      this.socketService.connect();

      /** Handle new messages */
      this.messageSub = this.socketService.onMessage().subscribe(data => {
        this.zone.run(() => {
          const selected = this.selectedUserSubject.value;
          if (
            selected &&
            ((data.senderId === selected.id && data.receiverId === this.currentUserId) ||
              (data.senderId === this.currentUserId && data.receiverId === selected.id))
          ) {
            this.isTyping = false;
            data._imgError = false;
            data._videoError = false;
            if (data.type === 'image' || data.type === 'video') {
              this.pendingMedia++;
            }
            const updated = [...this.messagesSubject.value, data];
            this.messagesSubject.next(updated);
            if (data.senderId === selected.id) {
              const unreadIds = updated.filter(m => !m.read).map(m => m._id).filter(Boolean);
              this.socketService.markMessagesAsRead(unreadIds);
            }
            setTimeout(() => {
              if (this.pendingMedia === 0) {
                this.scrollToBottom();
              }else{
                this.mediaLoaded();
              }
              // else: mediaLoaded() will handle

            }, 0);
          }
        });
      });

      this.groupMessageSub = this.socketService.onGroupMessage().subscribe(data => {
        this.zone.run(() => {
          const selectedGroup = this.selectedGroupSubject.value;
          if (selectedGroup && data.groupId === selectedGroup._id) {
            this.isTyping = false;
            data._imgError = false;
            data._videoError = false;
            data._videoLoaded = false;
            if (data.type === 'image') { // Videos don't load immediately
              this.pendingMedia++;
            }
            const updated = [...this.groupMessageSubject.value, data];
            this.groupMessageSubject.next(updated);
            setTimeout(() => {
              if (this.pendingMedia === 0) {
                this.scrollToBottom();
              }
              // else: mediaLoaded() will handle
            }, 0);
          }
        });
      });

      /** Listen for read receipts */
      this.socketService.messageRead$.subscribe(evt => {
        if (!evt) return;
        this.zone.run(() => {
          const updated = this.messagesSubject.value.map(m =>
            m._id === evt._id ? {...m, read: true, readAt: evt.readAt} : m
          );
          this.messagesSubject.next(updated);
        });
      });

      /** Typing indicator */
      this.socketService.onTyping().subscribe(({fromUserId}) => {
        this.zone.run(() => {
          const selected = this.selectedUserSubject.value;
          if (selected && selected.id === fromUserId) {
            this.typingUserId = fromUserId;
            this.isTyping = true;
            setTimeout(() => this.scrollToBottom(), 0);
            clearTimeout(this.typingTimeout);
            this.typingTimeout = setTimeout(() => {
              this.isTyping = false;
              this.cdr.markForCheck();
            }, 2000);

            this.cdr.markForCheck();
          }
        });
      });

      this.socketService.onStopTyping().subscribe(({fromUserId}) => {
        this.zone.run(() => {
          const selected = this.selectedUserSubject.value;
          if (selected && selected.id === fromUserId) {
            this.isTyping = false;
            this.cdr.markForCheck();
          }
        });
      });

      this.socketService.notification$.subscribe((notif) => {
        this.zone.run(() => {
          if (notif) {
            const selected = this.selectedUserSubject.value;
            // only show if the current chat isn't the sender
            if (!selected || selected.id !== notif.senderId) {
              this.notifications.push(notif);
              this.cdr.markForCheck();

              this.showToast(`${notif.message}...`);
            }
          }
        })
      });

      /** Load initial unread counts*/
      this.messageService.getUnreadCounts().subscribe(data => {
        const initialMap = new Map<string, number>();
        data.forEach(item => initialMap.set(item.senderId, item.count));
        this.unreadCounts = initialMap;
        this.cdr.markForCheck();
      });

      /** Listen for real-time updates */
      this.socketService.unreadCounts$.subscribe(map => {
        this.unreadCounts = map;
        this.cdr.markForCheck();
      });

      /** Load All groups related to the current user */
      this.groupService.getAllGroupsRelatedToUser().subscribe(groups => {
        this.groups = groups;
        this.cdr.markForCheck();
      })

      /** Listen for new groups*/
      this.socketService.onReceiveNewGroup().subscribe(group => {
        this.zone.run(() => {
          this.groups.push(group);
          this.cdr.markForCheck();
        })
      })

      /** Listen for message updates */
      this.socketService.onMessageUpdate().subscribe(data => {
        console.log('Message updated:', data);
        this.zone.run(() => {
          const selected = this.selectedUserSubject.value;
          if (selected && data.senderId === selected.id) {
            const updated = this.messagesSubject.value.map(m =>
              m._id === data._id ? {...m, ...data} : m
            );
            this.messagesSubject.next(updated);
          }
          this.cdr.markForCheck();
        });

      })
    });
  }

  selectUser(user: any) {
    this.isTyping = false;
    this.typingUserId = null;
    this.selectedUserSubject.next(user);
    this.selectedGroupSubject.next(null); // Ensure group is cleared
    this.messageService.getAllMessagesBySenderIdAndReceiverId(user.id).subscribe(messages => {
      this.zone.run(() => {
        this.pendingMedia = 0;
        messages.forEach(msg => {
          msg._imgError = false;
          msg._videoError = false;
          if (msg.type === 'image' || msg.type === 'video') { // Videos load metadata in user chats
            this.pendingMedia++;
          }
        });
        this.messagesSubject.next(messages);
        if (this.notifications.some(n => n.senderId === user.id)) {
          this.notifications = this.notifications.filter(n => n.senderId !== user.id);
        }
        const unreadIds = messages
          .filter(m => m.receiverId === this.currentUserId && !m.read)
          .map(m => m._id)
          .filter(Boolean);
        if (unreadIds.length) {
          this.socketService.markMessagesAsRead(unreadIds);
          const readMessages = messages.map(m =>
            unreadIds.includes(m._id) ? {...m, read: true, readAt: new Date()} : m
          );
          this.messagesSubject.next(readMessages);
        }
        setTimeout(() => {
          if (this.pendingMedia === 0) {
            this.scrollToBottom();
          }
          // else: mediaLoaded() will handle scrolling when done
        }, 0);
      });
    });
  }

  selectGroup(group: GroupDto) {
    this.isTyping = false;
    this.typingUserId = null;
    this.selectedUserSubject.next(null);
    this.selectedGroupSubject.next(group);
    this.groupMessageService.getAllMessagesByGroupId(group._id).subscribe(messages => {
      this.zone.run(() => {
        this.pendingMedia = 0;
        messages.forEach(msg => {
          msg._imgError = false;
          msg._videoError = false;
          msg._videoLoaded = false; // Explicitly set
          if (msg.type === 'image' || msg.type === 'video') {
            this.pendingMedia++;
          }
        });
        this.groupMessageSubject.next(messages);
        setTimeout(() => {
          if (this.pendingMedia === 0) {
            this.scrollToBottom();
          }
          // else: mediaLoaded() will handle scrolling when done
        }, 0);
        this.cdr.markForCheck();
      });
    });
  }

  loadOlderMessages() {
    if (this.loadingOlder) return;
    const container = document.getElementById('chat-container');
    if (!container) return; // save previous height to restore scroll position after prepending
    const prevScrollHeight = container.scrollHeight;
    const isUserChat = !!this.selectedUserSubject.value?.id;
    const isGroupChat = !!this.selectedGroupSubject.value?._id;
    if (!isUserChat && !isGroupChat) return;
    this.loadingOlder = true;
    if (isUserChat) {
      const oldest = this.messagesSubject.value[0]?.createdAt;
      if (!oldest) {
        this.loadingOlder = false;
        console.log('No older user messages to load');
        return;
      }
      this.messageService
        .getAllMessagesBySenderIdAndReceiverId(this.selectedUserSubject.value.id, oldest.toString())
        .subscribe(msgs => {
          // prepend older messages
          this.messagesSubject.next([...msgs, ...this.messagesSubject.value]);
          this.loadingOlder = false; // restore scroll position so view doesn't jump
          setTimeout(() => {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - prevScrollHeight;
            }, 0);
          }, err => {
            console.error('Failed to load older user messages', err);
            this.loadingOlder = false;
        });
    } else if (isGroupChat) {
      const oldestGroup = this.groupMessageSubject.value[0]?.createdAt;
      if (!oldestGroup) {
        this.loadingOlder = false;
        console.log('No older group messages to load');
        return;
      }
      this.groupMessageService
        .getAllMessagesByGroupId(this.selectedGroupSubject.value._id, oldestGroup.toString())
        .subscribe(msgs => {
          // prepend older messages
          this.groupMessageSubject.next([...msgs, ...this.groupMessageSubject.value]);
          this.loadingOlder = false;// restore scroll position so view doesn't jump
          setTimeout(() => {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - prevScrollHeight;
            }, 0);
          }, err => {
            console.error('Failed to load older group messages', err);
            this.loadingOlder = false;
        });
    }
  }


  scrollToBottom() {
    const container = document.getElementById('chat-container');
    if (container) container.scrollTop = container.scrollHeight;
  }

  mediaLoaded() {
    this.zone.run(() => {
      if (this.pendingMedia > 0) {
        this.pendingMedia--;
      }else{
        return;
      }
      if (this.pendingMedia <= 0) {
        const container = document.getElementById('chat-container');
        if (container) {
          if (this.loadingOlder) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - this.prevScrollHeight;
            this.loadingOlder = false;
          } else {
            container.scrollTop = container.scrollHeight;
          }
        }
      }
    });
  }

  onScroll(event: any) {
    const element = event.target;
    if (element.scrollTop === 0) this.loadOlderMessages();
  }

  onMessageInput() {
    if (this.isEditingMessage) return;
    const selectedUser = this.selectedUserSubject.value;
    if (selectedUser) {
      this.socketService.sendTyping(selectedUser.id);

      clearTimeout(this.typingTimeout);
      this.typingTimeout = setTimeout(() => {
        this.socketService.sendStopTyping(selectedUser.id);
      }, 1500);
    }
  }

  onFileSelected(event: any) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    this.fileService.uploadFile(formData).subscribe(res => {
      let fileType = 'file';
      if (file?.type) {
        if (file.type.startsWith('image/')) {
          fileType = 'image';
        } else if (file.type.startsWith('video/')) {
          fileType = 'video';
        }
      }

      let messageData: {
        senderId: string;
        receiverId?: string;
        fileUrl: string;
        type: string;
        groupId?: string;
      } = {
        senderId: this.currentUserId || '',
        fileUrl: '',
        type: ''
      };

      if (this.selectedUserSubject.value?.id) {
        messageData = {
          senderId: this.currentUserId || '',
          receiverId: this.selectedUserSubject.value.id || '',
          fileUrl: res.fileUrl,
          type: fileType
        };
      } else if (this.selectedGroupSubject.value) {
        messageData = {
          senderId: this.currentUserId || '',
          fileUrl: res.fileUrl,
          type: fileType,
          groupId: this.selectedGroupSubject.value._id || ''
        };
      }

      this.socketService.sendFileMessage(messageData);
      // clear the file input after a successful upload
      input.value = "";
    });
  }


  sendMessage() {
    const selectedUser = this.selectedUserSubject.value;
    if(!this.isEditingMessage){
      if (!this.messageText.trim() || !selectedUser) return;
      this.socketService.sendMessage(selectedUser.id, this.messageText);
      this.messageText = '';
    }
    this.onEditMessageSend();
  }

  sendGroupMessage() {
    const selectedGroup = this.selectedGroupSubject.value;
    if (!this.messageText.trim() || !selectedGroup) return
    this.socketService.sendGroupMessage(selectedGroup._id, this.messageText);
    this.messageText = '';
  }

  showToast(msg: string) {
    const toast = document.createElement('div');
    toast.innerText = msg;
    toast.className =
      'fixed bottom-5 right-5 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  hasNotificationFrom(userId: string | number): boolean {
    return Array.isArray(this.notifications) && this.notifications.some(n => n.senderId === userId);
  }

  openGroupDialog() {
    this.showGroupModal = true;
    this.newGroupName = '';
    this.selectedMembers.clear();
  }

  closeGroupDialog() {
    this.showGroupModal = false;
    this.newGroupName = '';
    this.selectedMembers.clear();
    this.cdr.markForCheck();
  }

  toggleMemberSelection(userId: string) {
    if (this.selectedMembers.has(userId)) {
      this.selectedMembers.delete(userId);
    } else {
      this.selectedMembers.add(userId);
    }
  }

  createGroup() {
    if (!this.newGroupName.trim() || this.selectedMembers.size === 0) {
      alert('Please provide a name and select members.');
      return;
    }

    const memberIds: string[] = Array.from(this.selectedMembers);
    this.groupService.createGroup(this.newGroupName, memberIds).subscribe(group => {
      this.socketService.onGroupCreate(group._id)
      this.closeGroupDialog();
    });
  }

  openVideoPopup(src: string) {
    this.zone.run(() => {
      this.activeVideoSrc = src;
      this.showVideoPopup = true;
      document.body.style.overflow = 'hidden'; // prevent background scroll
      setTimeout(() => {
        const modal = document.querySelector('[role="dialog"]') as HTMLElement;
        modal?.focus();
      }, 0);
    })
  }

  closeVideoPopup() {
    this.showVideoPopup = false;
    this.activeVideoSrc = null;
    document.body.style.overflow = 'auto';
  }

  get windowWidth(): number {
    return window.innerWidth;
  }

  onMsgContextMenu(event: MouseEvent, msg: MessageDto | GroupMessageDto) {
    event.preventDefault();
    event.stopPropagation();
    this.resetMessageMenu();
    // set menu position / state
    this.menuMessage = msg;
    this.messageMenuOpen = true;
    this.messageMenuX = event.clientX;
    this.messageMenuY = event.clientY;
    // flip if menu would overflow the viewport (menu width ~180px)
    this.messageMenuFlip = (event.clientX + 180 > this.windowWidth);
    // ensure template updates (you already use OnPush)
    this.cdr.markForCheck();
  }

  resetMessageMenu(){
    (document.activeElement as HTMLElement)?.blur();
    this.messageMenuOpen = false;
    this.menuMessage = null;
    this.messageMenuX = null;
    this.messageMenuY = null;
    this.messageMenuFlip = false;

    this.cdr.markForCheck();
  }

  onMessageEdit(msg: MessageDto | GroupMessageDto | null) {
    if (!msg) return;
    this.messageText = (msg.message || '').trim();
    this.originalEditingMessage = msg;
    this.isEditingMessage = true;
  }

  isEditable(createdAt: string | Date, senderId: string, deleted:boolean): boolean {
    if((senderId !== this.currentUserId && this.isEditingMessage) || deleted) return false;
    const createdTime = new Date(createdAt).getTime();
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    return createdTime >= tenMinutesAgo ;
  }

  isDeletable(deleted:boolean, readAt: string | Date,  senderId: string): boolean {
    if(deleted || senderId !== this.currentUserId) return false;
    if(readAt) {
      const readTime = new Date(readAt).getTime();
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      return readTime >= tenMinutesAgo ;
    }
    return true;
  }

  cancelEdit(){
    this.isEditingMessage = false;
    this.messageText = '';
    this.resetMessageMenu();

    this.cdr.markForCheck();
  }

  onEditMessageSend(){
    if (!this.messageText.trim()|| !this.originalEditingMessage || this.messageText.trim() === this.originalEditingMessage?.message.trim() ) {
      this.cancelEdit();
      return;
    }
    this.originalEditingMessage.message=this.messageText.trim();

    if (this.originalEditingMessage && 'receiverId' in this.originalEditingMessage) {
      this.messageService.updateMessage(this.originalEditingMessage).subscribe({
        next: (res) => {
          this.cancelEdit();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to update message', err);
          this.cancelEdit();
        }
      });
    } else {
      // Not a MessageDto (likely a GroupMessageDto) — cancel or handle group updates separately
      this.cancelEdit();
    }
  }

  onDeleteMessage(msg: MessageDto | GroupMessageDto | null) {
    if(!msg) return;
    this.messageService.deleteMessage(msg._id).subscribe({
      next: (res) => {
        const selected = this.selectedUserSubject.value;
        if (selected && res.receiverId === selected.id) {
          const updated = this.messagesSubject.value.map(m =>
            m._id === res._id ? {...m, ...res} : m
          );
          this.messagesSubject.next(updated);
        }
        this.resetMessageMenu();
      },
      error: (err) => {
        console.error('Failed to update message', err);
        this.resetMessageMenu();
      }
    });
    this.cdr.markForCheck();
  }

  ngOnDestroy() {
    if (this.messageSub) this.messageSub.unsubscribe();
    if (this.groupMessageSub) this.groupMessageSub.unsubscribe();
    this.socketService.disconnect();
  }

}
