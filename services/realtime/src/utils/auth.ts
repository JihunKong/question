import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from './logger';

export async function setupAuth(socket: Socket, next: (err?: any) => void) {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };
    
    // Attach user data to socket
    socket.data.userId = decoded.userId;
    socket.data.email = decoded.email;
    
    next();
  } catch (error) {
    logger.error('Socket authentication failed:', error);
    next(new Error('Invalid token'));
  }
}

export function requireAuth(socket: Socket): boolean {
  if (!socket.data.userId) {
    socket.emit('error', { message: 'Authentication required' });
    return false;
  }
  return true;
}