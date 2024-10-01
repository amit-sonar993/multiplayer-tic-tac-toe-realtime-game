// src/sockets.ts

import { Server } from 'socket.io';
import { handleChatMsgSend, handleGameRestart, handlePlayerAction, handleRoomDisconnect, handleRoomJoin } from './controllers/gameController';

const setupSockets = (io: Server) => {
    io.on('connection', (socket) => {
        console.log('A player connected:', socket.id);

        socket.on('join_room', (roomId: string) => {
            try {
                handleRoomJoin(roomId, socket, io)
            } catch (error) {
                console.log('error while joining a room', error);
            }
        });

        socket.on('player_action', ({ roomId, position }) => {
            try {
                handlePlayerAction(roomId, position, socket, io)
            } catch (error) {
                console.log('error on player action', error);
            }
        });

        socket.on('restart_game', (roomId: string) => {
            try {
                handleGameRestart(roomId, io)
            } catch (error) {
                console.log(`Error while handling game restart`);
            }
        });

        socket.on('chat_msg_send', ({ chatMsg, roomId }) => {
            console.log(chatMsg, roomId);
            try {
                handleChatMsgSend(chatMsg, roomId, io)
            } catch (error) {
                console.log(`erro while chat messages send`, error);
            }
        })

        socket.on('disconnect', () => {
            console.log('Player disconnected:', socket.id);
            try {
                handleRoomDisconnect(socket, io)
            } catch (error) {
                console.log(`Error while disconnecting from room`);

            }
        });
    });
};

export default setupSockets;
