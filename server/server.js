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
await db.query('CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, message TEXT NOT NULL, user_name VARCHAR(50) NOT NULL)');

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

    socket.on('chat message', async (msgObj) => { // When a client sends a message
        let result
        try {
            // TODO: Obtener el usuario que envió el mensaje
            await db.query('INSERT INTO messages (message, user_name) VALUES ($1, $2) RETURNING *', [msgObj.message, msgObj.user_name]);
            console.log('Mensaje insertado correctamente: ', msgObj);
            io.emit('chat message', msgObj); // Broadcast a todos los sockets conectados
        } catch (error) {
            console.error('Error al insertar el mensaje', error);
            return;
        }
    });
});

app.get('/', async (req, res) => {
    let data = [];
    try {
        const result = await db.query('SELECT * FROM messages ');
        data = result.rows;
    } catch (error) {
        console.error('Error al obtener los mensajes', error);
        return;
    }
    // msgObj contiene el id, el mensaje y el usuario que lo envió
    res.send(data);
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