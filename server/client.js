import express from 'express';
import logger from 'morgan';
import env from 'dotenv';
import axios from 'axios';

env.config();
const app = express();
const port = process.env.CLIENT_PORT ?? 3000;
app.use(logger('dev'));

const CHAT_API = 'http://localhost:4000/'

app.use(express.static('public'));

app.get('/', async (req, res) => {
   // const result = await axios.get(`${CHAT_API}`);
    res.render(process.cwd() + '/client/chat.ejs');
});

app.listen(port, () => {
    console.log(`Client listening at http://localhost:${port}`);
});
