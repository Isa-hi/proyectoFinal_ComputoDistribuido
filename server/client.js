import express from 'express';
import logger from 'morgan';
import env from 'dotenv';
import axios from 'axios';
import { Server } from 'socket.io';
import { io } from 'socket.io-client';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


env.config();
const app = express();
const port = process.env.CLIENT_PORT ?? 3000;
app.use(logger('dev'));

const CHAT_API = 'http://localhost:4000/'
const socket = io(CHAT_API); // Conectar al servidor de chat

app.use(express.static('client/public'));
app.use(bodyParser.urlencoded({ extended: true }));

let global_username = "test";

// Each client gets its own socket
socket.on('connect', () => { // Conectar al servidor de chat
    console.log('Connected to chat server', socket.id);
});


app.get('/', async (req, res) => {
    if(global_username == undefined) {
        res.redirect('/register');
    } else {
   const result = await axios.get(`${CHAT_API}`);
   const messagesObj = result.data; // Contiene id, message, user_id
   
   //console.log(messagesObj);
   res.render(process.cwd() + '/client/chat.ejs', { messages: messagesObj, user_name: global_username });
    }
});

app.get('/register', async (req, res) => {
    res.render(process.cwd() + '/client/register.ejs');
});

app.post('/register', async (req, res) => {
    const user_name = req.body.user_name;
    const password = req.body.password;
    const result = await axios.post(`${CHAT_API}register`, {
        user_name: user_name,
        password: password
    }, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    });
    if(result.status == 200) {
        res.redirect('/login');
    } else {
        res.redirect('/register');
    }
});

app.get('/login', async (req, res) => {
    res.render(process.cwd() + '/client/login.ejs');
});

app.post('/login', async (req, res) => {
    const user_name = req.body.user_name;
    const password = req.body.password;
    const result = await axios.post(`${CHAT_API}login`, {
        user_name: user_name,
        password: password
    }, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    });
    if(result.status == 200) {
        global_username = user_name;
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});

app.post('/upload', async (req, res) => {
  const formData = new FormData();
  formData.append('file', req.files.file.data);
  const result = await axios.post(`${CHAT_API}upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  });
  if(result.status == 200) {
    console.log('File uploaded successfully');
  } else {
    console.log('Error uploading file');
  }
});

app.get('/view/uploads/:file_path', (req, res) => {
    // Get the file path from the URL parameters
    const file_path = req.params.file_path;
    // Create an absolute path to the file
    const absolutePath = path.resolve(__dirname, '..',  'uploads', file_path);
    // Send the file
    res.sendFile(absolutePath);
  });

app.listen(port, () => {
    console.log(`Client listening at http://localhost:${port}`);
});
