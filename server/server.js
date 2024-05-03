import express from 'express';
import logger from 'morgan';
import { Server } from 'socket.io'; // Hace el handshake
import { createServer } from 'node:http';
import env from 'dotenv';
import pg from 'pg';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';

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
// Crear la tabla de ARCHIVOS si no existe
await db.query('CREATE TABLE IF NOT EXISTS files (id SERIAL PRIMARY KEY, file_path TEXT NOT NULL)')
// Crear la tabla de MENSAJES si no existe
await db.query('CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, message TEXT NOT NULL, user_name VARCHAR(50) NOT NULL, file_id INTEGER REFERENCES files(id))');
// Crear la tabla de USUARIOS si no existe
await db.query('CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, user_name VARCHAR(50) UNIQUE NOT NULL, password VARCHAR(50) NOT NULL)');

const storage = multer.diskStorage({
    destination: function (req, file, cb) { // Configurar el almacenamiento de archivos
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
}); 
const upload = multer({ storage: storage });

app.use(logger('dev'));
app.use(cors({ // Habilitar CORS para que cualquier cliente pueda conectarse
    origin: '*',
    credentials: false, // No se requieren cookies para la conexión
}));
app.use(bodyParser.urlencoded({ extended: true }));


io.on('connection', async (socket) => { // Each client gets its own socket
    console.log('User connected to ', socket.id);

    socket.on('disconnect', () => { // When a specific client disconnects
        console.log('user disconnected');
    });

    socket.on('chat message', async (msgObj) => { // When a client sends a message
        let result;
        try {
            // TODO: Obtain the user who sent the message
            result = await db.query('INSERT INTO messages (message, user_name, file_id) VALUES ($1, $2, $3) RETURNING *', [msgObj.message, msgObj.user_name, msgObj.fileId]);
            console.log('Message inserted correctly: ', msgObj);
            // If there's a file associated with the message, get the file path
            if (msgObj.fileId) {
            const fileResult = await db.query('SELECT file_path FROM files WHERE id = $1', [msgObj.fileId]);
            msgObj.file_path = fileResult.rows[0].file_path;
            }
            io.emit('chat message', msgObj); // Broadcast to all connected sockets
        } catch (error) {
            console.error('Error inserting the message', error);
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
    // añadir el campo file_path al objeto msgObj
    for (let msgObj of data) {
        if (msgObj.file_id) {
            try {
                const result = await db.query('SELECT file_path FROM files WHERE id = $1', [msgObj.file_id]);
                msgObj.file_path = result.rows[0].file_path;
            } catch (error) {
                console.error('Error al obtener el archivo', error);
                return;
            }
        }
    }
    console.log('Mensajes encontrados: ', data);
    res.send(data);
});

app.post('/register', async (req, res) => {
    console.log("server side", req.body);
    try {
        await db.query('INSERT INTO users (user_name, password) VALUES ($1, $2) RETURNING *', [req.body.user_name, req.body.password]);
        console.log('Usuario insertado correctamente: ', req.body);
    } catch (error) {
        console.error('Error al insertar el usuario', error);
        return;
    }
    res.sendStatus(200);
});

app.post('/login', async (req, res) => {
    console.log("server side", req.body);
    let result;
    try {
        try {
            const result = await db.query('SELECT * FROM users WHERE user_name = $1', [req.body.user_name]);
            console.log('Usuario encontrado: ', result.rows[0]);
        } catch (error) {
            console.error('Usuario no existe', error);
            res.sendStatus(500);
        }
        result = await db.query('SELECT * FROM users WHERE user_name = $1 AND password = $2', [req.body.user_name, req.body.password]);
        console.log('Usuario encontrado: ', result.rows[0]);
        res.sendStatus(200);
    } catch (error) {
        console.error('Contraseña incorrecta', error);
        res.sendStatus(500);
    }
});


app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    // Save the file path in the database
    const result = await db.query('INSERT INTO files (file_path) VALUES ($1) RETURNING *', [req.file.path]);
    res.json({ fileId: result.rows[0].id });
  } catch (error) {
    console.error('Error uploading file', error);
    res.sendStatus(500);
  }
});


server.listen(port, () => { // Escuchamos el servidor de HTTP 
    console.log(`Server is running on port ${port}`);
});