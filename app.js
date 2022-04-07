const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors')
const { Buttons, List } = require('whatsapp-web.js');

const socketIO = require('socket.io');
const qrcode = require('qrcode');
const https = require('https');
const http = require('http');

const fs = require('fs');
const { phoneNumberFormatter } = require('./helpers/formatter');
const axios = require('axios');
const port = 2096;

//sudo openssl genrsa -aes128 -out private.key 2048
//sudo openssl req -new -days 365 -key private.key -out private.csr

   var privateKey = fs.readFileSync('private.key', 'utf8');
   var certificate = fs.readFileSync('private.crt', 'utf8');
   var credentials = { key: privateKey, cert: certificate };

const app = express();
const server = https.createServer(credentials, app);
//const server = http.createServer(app);

const io = socketIO(server);
io.set('origins', '*:*');

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({
  extended: true,
  limit:'50mb'
}));
app.use(cors())
app.options('*', cors());
app.get('/', (req, res) => {
  res.sendFile('index-multiple-device.html', {
    root: __dirname
  });
});

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true }
});

client.initialize();

client.on('qr', (qr) => {
  console.log('QR RECEIVED', qr);
  qrcode.toDataURL(qr, (err, url) => {
    io.emit('qr', { src: url });
    io.emit('message', { text: 'QR Code received, scan please!' });
  });
});

client.on('authenticated', () => {
  io.emit('ready');
  io.emit('message', { ext: 'Whatsapp is authenticated!' });
});

client.on('auth_failure', msg => {
  console.error('BOT-ZDG Falha na autenticação', msg);
  io.emit('message', { text: 'Auth failure, restarting...' });
});

client.on('ready', () => {
  io.emit('ready');
  io.emit('message', { text: 'Whatsapp is ready!' });
});

client.on('message', async msg => {
  // msg.reply('Sou uma inteligência artificial, não entendi sua mensagem por favor selecione o botão enviado pelo operador!😃');
});


app.post('/send-pdf', async (req, res) => {
  console.log("entrou")
  const number = phoneNumberFormatter("55" + req.body.number);
  const message = req.body.message;

  // console.log(message)
  // const client = sessions.find(sess => sess.id == sender).client;

  const image = await new MessageMedia("application/pdf", message, "documento.pdf");
  client.sendMessage(number, image).then(response => {
    console.log(response)
    res.status(200).json({
      status: true,
      response: response
    });
  }).catch(err => {
    console.log(err);
    res.status(500).json({
      status: false,
      response: err
    });
  });
});

app.post('/send-message', (req, res) => {
  const number = phoneNumberFormatter("55" + req.body.number);
  const message = req.body.message;
  // console.log(message)
  // const client = sessions.find(sess => sess.id == sender).client;

  client.sendMessage(number, message).then(response => {
    console.log(response)
    res.status(200).json({
      status: true,
      response: response
    });
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  });
});

server.listen(port, function () {
  console.log('App running on *: ' + port);
});



app.post('/send-button', (req, res) => {

  const number = phoneNumberFormatter("55" + req.body.number);
  const message = req.body.message;
  const id = req.body.id;
  const button1 = req.body.button1;
  const button2 = req.body.button2;
  const texto = req.body.texto;
  const sender = req.body.sender;

  // const client = sessions.find(sess => sess.id == sender).client;
  client.sendMessage(number, new List(' ', 'Clique aqui para selecionar', [{ title: 'Selecione a ação desejada', rows: [{ id: id, title: 'Sim', description: '' }, { title: 'Não' }] }], 'Selecione SIM ou NÃO', ''), { caption: '' }).then(response => {
    res.status(200).json({
      status: true,
      response: response
    });
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  });
});



client.on('change_state', state => {
  console.log('BOT-ZDG Status de conexão: ', state);
});

client.on('disconnected', (reason) => {
  io.emit('message', { text: 'Whatsapp is disconnected!' });
});
