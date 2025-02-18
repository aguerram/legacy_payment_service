import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, OnGatewayConnection, MessageBody, OnGatewayDisconnect, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { WsJwtAuthGuard } from 'src/auth/jwt/ws-jwt-auth.guard';
import { socketRoomHelpers } from 'src/shared/helpers';
import { SocketEvents } from './socket_events';
import { SocketSendData } from './socket_send_data';
import { MobileUploadDocumentsPayload, WsAuthenticatedPayload } from './types';

@WebSocketGateway()
@Injectable()
export class ApplicationGateway implements OnGatewayConnection, OnGatewayDisconnect {

  private logger: Logger = new Logger(ApplicationGateway.name)
  @WebSocketServer()
  private server: Server;

  private connections = new Map();

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log("New client connected")
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log("A client disconnected")

  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage(SocketEvents.AUTHENTICATE)
  handleAuthenticationEvent(@ConnectedSocket() client: Socket, @MessageBody() data: WsAuthenticatedPayload) {
    this.logger.warn(`The account ID ${data._account || "*MobileUpload*"} of merchant ${data._merchant} has connected to the socket`)
    if (data._account)
      client.join(socketRoomHelpers.accountRoomPrefix(data._account))
    if (data._merchant)
      client.join(socketRoomHelpers.merchantRoomPrefix(data._merchant))
  }

  public brodcast(room: string, event: string, data: SocketSendData) {
    this.logger.log(`Brodcasting message to roomt '${room}' with event '${event}' `)
    this.server.to(room).emit(event, data)
  }

  // //client: Socket,
  // @UseGuards(WsJwtAuthGuard)
  // @SubscribeMessage('message')
  // handleMessage(
  //   @ConnectedSocket() client: Socket,
  //   @MessageBody() data: MobileUploadDocumentsPayload) {
  //   console.log("Accessed ", data.id);
  // }
}
