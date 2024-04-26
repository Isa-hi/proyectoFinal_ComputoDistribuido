import express from 'express';

const app = express();
const port = 3000;

app.get('/', (req, res) => {
    // No sé si poner algo aquí o directamente enviar al chat y que el chat envíe al login en caso de q no esté logueado
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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});