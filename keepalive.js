import express from 'express';
const app = express();
app.get('/', (req, res) => res.send('Bot en ligne'));
app.listen(3000, () => console.log('🟢 Serveur keep‑alive sur 3000'));
