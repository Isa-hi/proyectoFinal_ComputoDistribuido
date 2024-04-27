import express from 'express';
import logger from 'morgan';
import { Server } from 'socket.io'; // Hace el handshake
import { createServer } from 'node:http';
import env from 'dotenv';
import pg from 'pg';
import cors from 'cors';

env.config();
const app = express();
const port = process.env.EXPRESS_PORT ?? 4000;
const server = createServer(app); // Crear el servidor HTTP
const io = new Server(server, { // Crear el servidor de WebSockets
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const db = new pg.Client({ // Crear la conexión a la base de datos
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
}); 
db.connect();
// Crear la tabla de usuarios si no existe
await db.query('CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, message TEXT NOT NULL, user_id INT NOT NULL)');

app.use(logger('dev'));
app.use(cors({ // Habilitar CORS para que cualquier cliente pueda conectarse
    origin: '*',
    credentials: false, // No se requieren cookies para la conexión
}));


io.on('connection', async (socket) => { // Each client gets its own socket
    console.log('User connected to ', socket.id);

    socket.on('disconnect', () => { // When a specific client disconnects
        console.log('user disconnected');
    });

    socket.on('chat message', async (msg) => { // When a client sends a message
        let result
        try {
            // TODO: Obtener el usuario que envió el mensaje
            result = await db.query('INSERT INTO messages (message, user_id) VALUES ($1, $2) RETURNING *', [msg, 1]);
            console.log(result.rows[0]);
            io.emit('chat message', msg); // Broadcast a todos los sockets conectados
        } catch (error) {
            console.error('Error al insertar el mensaje', error);
            return;
        }
        console.log('message: ' + msg);
    });
});

app.get('/', async (req, res) => {

    // msgObj contiene el id, el mensaje y el id del usuario que lo envió
    res.render(process.cwd() + '/client/chat.ejs' , { messages: data })
});

app.get('/login', (req, res) => {
    // LOGIN con User y Password
});

app.get('/register', (req, res) => {
    // REGISTER con User, Password
});

app.get('/chat', (req, res) => {
    // CHAT tendrá identificación para saber qué usuario está accediendo
});

server.listen(port, () => { // Escuchamos el servidor de HTTP 
    console.log(`Server is running on port ${port}`);
});