import express from 'express'
import cors from 'cors'
import path from 'path'
import http from 'http'
import bodyParser from 'body-parser'
import ejs from 'ejs'
import session from 'express-session'
import passport from 'passport'
import cookieParser from 'cookie-parser'
import url from 'url';
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
import * as io from 'socket.io';

let app = express()
const server = http.createServer(app);
const socket = new io.Server();
socket.attach(server);

socket.on('connect', (socket) => {
  console.log('user connected')
  socket.on('chat message', (msg) => {
    socket.emit('chat message', msg);
  });
});
socket.on('disconnect', () => {
  console.log('user disconnected');
});

import {authRouter} from './server-auth.js'

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// App Configuration /////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.use(cookieParser());
app.use(cors());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({secret: 'This is important.', resave: false, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/auth', authRouter)



import {config} from "./config.js";
import Installation from "./fsclients/installation.js";
import {filesSizeTransform} from "./fsclients/sync.js";
let installation = new Installation(config)

app.get("/", async (req, res) => {
  res.send('server works')
})
app.get("/views/installation", async (req, res) => {
  let files = await installation.local.listDeep()
  function each(array, foo){
    return array.reduce((prev,curr )=>prev + foo(curr),'')
  }
  function InstallationItem(data){
    return data.files ?
      `<details open>
        <summary>${data.name}</summary>
        <ul>
          ${each(data.files,file => `<li>${InstallationItem(file)}</li>`)}
        </ul>
      </details>`
      :
      `<div>${data.name} Size: ${filesSizeTransform(data.size)} Hash: ${data.hash}</div>`
  }
  res.send(`
    <ul>
        <li>${InstallationItem({files, name: 'files'})}</li>
    </ul>
  `)
})
app.get("/installation", async (req, res) => {
  let files = await installation.local.listDeep()
  res.send(files)
})
app.get("/sse/installation", async (req, res) => {
  res.set({
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Content-Type": "text/event-stream",
  });
  res.flushHeaders();

  let counter = 0;
  const interval = setInterval(() => {
    res.write("" + counter++);
  }, 1000);

  res.on("close", () => {
    clearInterval(interval);
    res.end();
  });

  let files = await installation.local.listDeep()
  res.write("" + JSON.stringify(files));
})



let port = process.env.PORT || process.argv[3] || 3000
app.listen(port)
console.log('server started ' + port)
