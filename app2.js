const { Client, MessageMedia,LocalAuth } = require('whatsapp-web.js');
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
//  var privateKey = fs.readFileSync('selfsigned.key', 'utf8');
//  var certificate = fs.readFileSync('selfsigned.crt', 'utf8');
//  var credentials = { key: privateKey, cert: certificate };

const app = express();
 //const server = https.createServer(credentials, app);
const server = http.createServer(app);

const io = socketIO(server);
io.set('origins', '*:*');

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(cors())
app.options('*', cors());
app.get('/', (req, res) => {
  res.sendFile('index-multiple-device.html', {
    root: __dirname
  });
});

const sessions = [];
const SESSIONS_FILE = './whatsapp-sessions.json';

const createSessionsFileIfNotExists = function () {
  if (!fs.existsSync(SESSIONS_FILE)) {
    try {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify([]));
      console.log('Sessions file created successfully.');
    } catch (err) {
      console.log('Failed to create sessions file: ', err);
    }
  }
}

createSessionsFileIfNotExists();

const setSessionsFile = function (sessions) {
  fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions), function (err) {
    if (err) {
      console.log(err);
    }
  });
}

const getSessionsFile = function () {
  return JSON.parse(fs.readFileSync(SESSIONS_FILE));
}

const createSession = function (id, description) {
  console.log('Creating session: ' + id);
  const SESSION_FILE_PATH = `./whatsapp-session-${id}.json`;
  let sessionCfg;
  if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
  }
  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      // args: [
      //   '--no-sandbox',
      //   //         '--disable-setuid-sandbox',
      //   //         '--disable-dev-shm-usage',
      //   //        '--disable-accelerated-2d-canvas',
      //   //          '--disable-gpu'

      // ],
    }
  });
  // const client = new Client({
  //   restartOnAuthFail: true,
  //   puppeteer: {
  //     headless: true,
  //     args: [
  //       '--no-sandbox',
  //       '--disable-setuid-sandbox',
  //       '--disable-dev-shm-usage',
  //       '--disable-accelerated-2d-canvas',
  //       '--no-first-run',
  //       '--no-zygote',
  //       '--single-process', // <- this one doesn't works in Windows
  //       '--disable-gpu'
  //     ],
  //   },
  //   session: sessionCfg
  // });

  client.initialize();

  client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      io.emit('qr', { id: id, src: url });
      io.emit('message', { id: id, text: 'QR Code received, scan please!' });
    });
  });


  client.on('message', async (msg) => {
    if (!msg.from.toUpperCase().includes("g.us")) {

      if (msg.type == "list_response") {
        if (msg.body == "Sim") {
          msg.reply('Ok, vamos te passar maiores informações sobre o paciente😃')
          client.sendMessage("120363022690336998@g.us", msg.selectedRowId);

          if (msg.selectedRowId.toUpperCase().includes("THAIS ALVES")) {
            client.sendMessage("120363039348257323@g.us", msg.selectedRowId);
          }


          if (msg.selectedRowId.toUpperCase().includes("BEATRIZ NALIM")) {
            client.sendMessage("120363038291296660@g.us", msg.selectedRowId);
          }

          if (msg.selectedRowId.toUpperCase().includes("BIANCA NASCIMENTO")) {
            client.sendMessage("120363039945172091@g.us", msg.selectedRowId);
          }

          if (msg.selectedRowId.toUpperCase().includes("THAIS RODRIGUES")) {
            client.sendMessage("120363024013484590@g.us", msg.selectedRowId);
          }

          if (msg.selectedRowId.toUpperCase().includes("JULIANA SOUZA")) {
            client.sendMessage("120363040378100634@g.us", msg.selectedRowId);
          }
          if (msg.selectedRowId.toUpperCase().includes("ANNE OLIVEIRA")) {
            client.sendMessage("120363039377213562@g.us", msg.selectedRowId);
          }
          if (msg.selectedRowId.toUpperCase().includes("ANNA BEATRIZ")) {
            client.sendMessage("120363038774243623@g.us", msg.selectedRowId);
          }
          if (msg.selectedRowId.toUpperCase().includes("BENE SOUZA")) {
            client.sendMessage("120363023390637872@g.us", msg.selectedRowId);
          }
          if (msg.selectedRowId.toUpperCase().includes("HAYNE SEJANI")) {
            client.sendMessage("120363023276101126@g.us", msg.selectedRowId);
          }
          if (msg.selectedRowId.toUpperCase().includes("PAMELA SOUZA")) {
            client.sendMessage("120363039562349093@g.us", msg.selectedRowId);
          }

        }
        else if (msg.body == "Não") {
          msg.reply('Ok, agradeço pelo retorno, surgindo novo paciente próximo a sua área de atendimento entraremos em contato😃')
        }
      } else {
        msg.reply('Sou uma inteligência artificial, não entendi sua mensagem por favor selecione o botão enviado pelo operador!😃')
      }

    }

  });




  client.on('ready', () => {
    io.emit('ready', { id: id });
    io.emit('message', { id: id, text: 'Whatsapp is ready!' });

    const savedSessions = getSessionsFile();
    const sessionIndex = savedSessions.findIndex(sess => sess.id == id);
    savedSessions[sessionIndex].ready = true;
    setSessionsFile(savedSessions);
  });

  client.on('authenticated', (session) => {
    io.emit('authenticated', { id: id });
    io.emit('message', { id: id, text: 'Whatsapp is authenticated!' });
    sessionCfg = session;
    // fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function(err) {
    //   if (err) {
    //     console.error(err);
    //   }
    // });
  });

  client.on('auth_failure', function (session) {
    io.emit('message', { id: id, text: 'Auth failure, restarting...' });
  });

  client.on('disconnected', (reason) => {
    io.emit('message', { id: id, text: 'Whatsapp is disconnected!' });
    fs.unlinkSync(SESSION_FILE_PATH, function (err) {
      if (err) return console.log(err);
      console.log('Session file deleted!');
    });
    client.destroy();
    client.initialize();

    // Menghapus pada file sessions
    const savedSessions = getSessionsFile();
    const sessionIndex = savedSessions.findIndex(sess => sess.id == id);
    savedSessions.splice(sessionIndex, 1);
    setSessionsFile(savedSessions);

    io.emit('remove-session', id);
  });

  // Tambahkan client ke sessions
  sessions.push({
    id: id,
    description: description,
    client: client
  });

  // Menambahkan session ke file
  const savedSessions = getSessionsFile();
  const sessionIndex = savedSessions.findIndex(sess => sess.id == id);

  if (sessionIndex == -1) {
    savedSessions.push({
      id: id,
      description: description,
      ready: false,
    });
    setSessionsFile(savedSessions);
  }
}

const init = function (socket) {
  const savedSessions = getSessionsFile();

  if (savedSessions.length > 0) {
    if (socket) {
      socket.emit('init', savedSessions);
    } else {
      savedSessions.forEach(sess => {
        createSession(sess.id, sess.description);
      });
    }
  }
}

init();

// Socket IO
io.on('connection', function (socket) {
  init(socket);

  socket.on('create-session', function (data) {
    console.log('Create session: ' + data.id);
    createSession(data.id, data.description);
  });
});

// io.on('connection', function(socket) {
//   socket.emit('message', 'Connecting...');

//   client.on('qr', (qr) => {
//     console.log('QR RECEIVED', qr);
//     qrcode.toDataURL(qr, (err, url) => {
//       socket.emit('qr', url);
//       socket.emit('message', 'QR Code received, scan please!');
//     });
//   });

//   client.on('ready', () => {
//     socket.emit('ready', 'Whatsapp is ready!');
//     socket.emit('message', 'Whatsapp is ready!');
//   });

//   client.on('authenticated', (session) => {
//     socket.emit('authenticated', 'Whatsapp is authenticated!');
//     socket.emit('message', 'Whatsapp is authenticated!');
//     console.log('AUTHENTICATED', session);
//     sessionCfg = session;
//     fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function(err) {
//       if (err) {
//         console.error(err);
//       }
//     });
//   });

//   client.on('auth_failure', function(session) {
//     socket.emit('message', 'Auth failure, restarting...');
//   });

//   client.on('disconnected', (reason) => {
//     socket.emit('message', 'Whatsapp is disconnected!');
//     fs.unlinkSync(SESSION_FILE_PATH, function(err) {
//         if(err) return console.log(err);
//         console.log('Session file deleted!');
//     });
//     client.destroy();
//     client.initialize();
//   });
// });

// Send message
app.post('/send-message', (req, res) => {
  const sender = req.body.sender;
  const number = phoneNumberFormatter("55" + req.body.number);
  const message = req.body.message;
  console.log(message)
  const client = sessions.find(sess => sess.id == sender).client;

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

  const client = sessions.find(sess => sess.id == sender).client;
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



// const { Client, MessageMedia } = require('whatsapp-web.js');
// const express = require('express');
// const cors = require('cors')

// const { body, validationResult } = require('express-validator');
// const socketIO = require('socket.io');
// const qrcode = require('qrcode');
// const http = require('http');
// const fs = require('fs');
// const { phoneNumberFormatter } = require('./helpers/formatter');
// const fileUpload = require('express-fileupload');
// const axios = require('axios');
// const mime = require('mime-types');
// const { Buttons, List } = require('whatsapp-web.js');

// const port = process.env.PORT || 8000;

// const app = express();
// const server = http.createServer(app);
// const io = socketIO(server);

// app.use(express.json());
// app.use(cors())
// app.use(express.urlencoded({
//   extended: true
// }));
// app.use(fileUpload({
//   debug: true
// }));

// const SESSION_FILE_PATH = './whatsapp-session.json';
// let sessionCfg;
// if (fs.existsSync(SESSION_FILE_PATH)) {
//   sessionCfg = require(SESSION_FILE_PATH);
// }

// app.get('/', (req, res) => {
//   res.sendFile('index.html', {
//     root: __dirname
//   });
// });

// const client = new Client({
//   restartOnAuthFail: true,
//   puppeteer: {
//     headless: true,
//     args: [
//       '--no-sandbox',
//       '--disable-setuid-sandbox',
//       '--disable-dev-shm-usage',
//       '--disable-accelerated-2d-canvas',
//       '--no-first-run',
//       '--no-zygote',
//       '--single-process', // <- this one doesn't works in Windows
//       '--disable-gpu'
//     ],
//   },
//   session: sessionCfg
// });

// client.on('message', msg => {
//   if (msg.body == '!ping') {
//     msg.reply('pong');
//   } else if (msg.body == 'good morning') {
//     msg.reply('selamat pagi');
//   } else if (msg.body == '!groups') {
//     client.getChats().then(chats => {
//       const groups = chats.filter(chat => chat.isGroup);

//       if (groups.length == 0) {
//         msg.reply('You have no group yet.');
//       } else {
//         let replyMsg = '*YOUR GROUPS*\n\n';
//         groups.forEach((group, i) => {
//           replyMsg += `ID: ${group.id._serialized}\nName: ${group.name}\n\n`;
//         });
//         replyMsg += '_You can use the group id to send a message to the group._'
//         msg.reply(replyMsg);
//       }
//     });
//   }

//   // Downloading media
//   if (msg.hasMedia) {
//     msg.downloadMedia().then(media => {
//       // To better understanding
//       // Please look at the console what data we get
//       console.log(media);

//       if (media) {
//         // The folder to store: change as you want!
//         // Create if not exists
//         const mediaPath = './downloaded-media/';

//         if (!fs.existsSync(mediaPath)) {
//           fs.mkdirSync(mediaPath);
//         }

//         // Get the file extension by mime-type
//         const extension = mime.extension(media.mimetype);

//         // Filename: change as you want! 
//         // I will use the time for this example
//         // Why not use media.filename? Because the value is not certain exists
//         const filename = new Date().getTime();

//         const fullFilename = mediaPath + filename + '.' + extension;

//         // Save to file
//         try {
//           fs.writeFileSync(fullFilename, media.data, { encoding: 'base64' });
//           console.log('File downloaded successfully!', fullFilename);
//         } catch (err) {
//           console.log('Failed to save the file:', err);
//         }
//       }
//     });
//   }
// });

// client.initialize();

// // Socket IO
// io.on('connection', function (socket) {
//   socket.emit('message', 'Connecting...');

//   client.on('qr', (qr) => {
//     console.log('QR RECEIVED', qr);
//     qrcode.toDataURL(qr, (err, url) => {
//       socket.emit('qr', url);
//       socket.emit('message', 'QR Code received, scan please!');
//     });
//   });

//   client.on('ready', () => {
//     socket.emit('ready', 'Whatsapp is ready!');
//     socket.emit('message', 'Whatsapp is ready!');
//   });

//   client.on('authenticated', (session) => {
//     socket.emit('authenticated', 'Whatsapp is authenticated!');
//     socket.emit('message', 'Whatsapp is authenticated!');
//     console.log('AUTHENTICATED', session);
//     sessionCfg = session;
//     fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
//       if (err) {
//         console.error(err);
//       }
//     });
//   });

//   client.on('auth_failure', function (session) {
//     socket.emit('message', 'Auth failure, restarting...');
//   });

//   client.on('disconnected', (reason) => {
//     socket.emit('message', 'Whatsapp is disconnected!');
//     fs.unlinkSync(SESSION_FILE_PATH, function (err) {
//       if (err) return console.log(err);
//       console.log('Session file deleted!');
//     });
//     client.destroy();
//     client.initialize();
//   });
// });


const checkRegisteredNumber = async function (number) {
  const isRegistered = await client.isRegisteredUser(number);
  return isRegistered;
}

// // Send message
// app.post('/send-message', [
//   body('number').notEmpty(),
//   body('message').notEmpty(),
// ], async (req, res) => {
//   const errors = validationResult(req).formatWith(({
//     msg
//   }) => {
//     return msg;
//   });

//   if (!errors.isEmpty()) {
//     return res.status(422).json({
//       status: false,
//       message: errors.mapped()
//     });
//   }

//   const number = phoneNumberFormatter("55" + req.body.number);
//   const message = req.body.message;

//   const isRegisteredNumber = await checkRegisteredNumber(number);

//   if (!isRegisteredNumber) {
//     return res.status(422).json({
//       status: false,
//       message: 'The number is not registered'
//     });
//   }

//   client.sendMessage(number, message).then(response => {
//     res.status(200).json({
//       status: true,
//       response: response
//     });
//   }).catch(err => {
//     res.status(500).json({
//       status: false,
//       response: err
//     });
//   });
// });



// // Send media
// app.post('/send-media', async (req, res) => {
//   const number = phoneNumberFormatter(req.body.number);
//   const caption = req.body.caption;
//   const fileUrl = req.body.file;

//   // const media = MessageMedia.fromFilePath('./image-example.png');
//   // const file = req.files.file;
//   // const media = new MessageMedia(file.mimetype, file.data.toString('base64'), file.name);
//   let mimetype;
//   const attachment = await axios.get(fileUrl, {
//     responseType: 'arraybuffer'
//   }).then(response => {
//     mimetype = response.headers['content-type'];
//     return response.data.toString('base64');
//   });

//   const media = new MessageMedia(mimetype, attachment, 'Media');

//   client.sendMessage(number, media, {
//     caption: caption
//   }).then(response => {
//     res.status(200).json({
//       status: true,
//       response: response
//     });
//   }).catch(err => {
//     res.status(500).json({
//       status: false,
//       response: err
//     });
//   });
// });

// const findGroupByName = async function (name) {
//   const group = await client.getChats().then(chats => {
//     return chats.find(chat =>
//       chat.isGroup && chat.name.toLowerCase() == name.toLowerCase()
//     );
//   });
//   return group;
// }

// // Send message to group
// // You can use chatID or group name, yea!
// app.post('/send-group-message', [
//   body('id').custom((value, { req }) => {
//     if (!value && !req.body.name) {
//       throw new Error('Invalid value, you can use `id` or `name`');
//     }
//     return true;
//   }),
//   body('message').notEmpty(),
// ], async (req, res) => {
//   const errors = validationResult(req).formatWith(({
//     msg
//   }) => {
//     return msg;
//   });

//   if (!errors.isEmpty()) {
//     return res.status(422).json({
//       status: false,
//       message: errors.mapped()
//     });
//   }

//   let chatId = req.body.id;
//   const groupName = req.body.name;
//   const message = req.body.message;

//   // Find the group by name
//   if (!chatId) {
//     const group = await findGroupByName(groupName);
//     if (!group) {
//       return res.status(422).json({
//         status: false,
//         message: 'No group found with name: ' + groupName
//       });
//     }
//     chatId = group.id._serialized;
//   }

//   client.sendMessage(chatId, message).then(response => {
//     res.status(200).json({
//       status: true,
//       response: response
//     });
//   }).catch(err => {
//     res.status(500).json({
//       status: false,
//       response: err
//     });
//   });
// });

// // Clearing message on spesific chat
// app.post('/clear-message', [
//   body('number').notEmpty(),
// ], async (req, res) => {
//   const errors = validationResult(req).formatWith(({
//     msg
//   }) => {
//     return msg;
//   });

//   if (!errors.isEmpty()) {
//     return res.status(422).json({
//       status: false,
//       message: errors.mapped()
//     });
//   }

//   const number = phoneNumberFormatter(req.body.number);

//   const isRegisteredNumber = await checkRegisteredNumber(number);

//   if (!isRegisteredNumber) {
//     return res.status(422).json({
//       status: false,
//       message: 'The number is not registered'
//     });
//   }

//   const chat = await client.getChatById(number);

//   chat.clearMessages().then(status => {
//     res.status(200).json({
//       status: true,
//       response: status
//     });
//   }).catch(err => {
//     res.status(500).json({
//       status: false,
//       response: err
//     });
//   })
// });

// server.listen(port, function () {
//   console.log('App running on *: ' + port);
// });
