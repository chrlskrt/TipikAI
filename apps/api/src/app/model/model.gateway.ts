import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL || 'https://your-frontend.vercel.app',
    ],
    credentials: true,
  },
})
export class ModelGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ModelGateway.name);

  /**
   * Handle client connection
   */
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Handle client joining an execution room
   */
  @SubscribeMessage('join-execution')
  handleJoinExecution(client: Socket, executionId: string) {
    this.logger.log(`Client ${client.id} joining execution room: ${executionId}`);
    client.join(`execution:${executionId}`);
    return { status: 'joined', executionId };
  }

  /**
   * Handle client leaving an execution room
   */
  @SubscribeMessage('leave-execution')
  handleLeaveExecution(client: Socket, executionId: string) {
    this.logger.log(`Client ${client.id} leaving execution room: ${executionId}`);
    client.leave(`execution:${executionId}`);
    return { status: 'left', executionId };
  }

  /**
   * Broadcast execution update to all clients in the execution room
   * Called by ModelService when n8n webhook updates the execution
   */
  broadcastExecutionUpdate(executionId: string, data: any) {
    const room = `execution:${executionId}`;
    this.logger.log(`Broadcasting update to room ${room}:`, {
      status: data.status,
      progress: data.progress,
      currentStage: data.currentStage,
    });
    
    this.server.to(room).emit('execution-update', data);
  }
}
