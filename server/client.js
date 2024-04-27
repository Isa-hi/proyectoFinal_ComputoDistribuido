import express from 'express';
import logger from 'morgan';
import env from 'dotenv';
import axios from 'axios';
import { Server } from 'socket.io';
import { io } from 'socket.io-client';

env.config();
const app = express();
const port = process.env.CLIENT_PORT ?? 3000;
app.use(logger('dev'));

const CHAT_API = 'http://localhost:4000/'
const socket = io(CHAT_API); // Conectar al servidor de chat

app.use(express.static('public'));

// Each client gets its own socket
socket.on('connect', () => { // Conectar al servidor de chat
    console.log('Connected to chat server', socket.id);
});


app.get('/', async (req, res) => {
   const result = await axios.get(`${CHAT_API}`);
   const messagesObj = result.data; // Contiene id, message, user_id
   console.log(messagesObj);
   res.render(process.cwd() + '/client/chat.ejs', { messages: messagesObj });
});

app.listen(port, () => {
    console.log(`Client listening at http://localhost:${port}`);
});
