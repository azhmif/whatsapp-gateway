'use strict';

const Hapi = require('@hapi/hapi');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
 
const fs = require('fs');
const SESSION_FILE_PATH = './session.json';
let sessionCfg;
// cek session login wa 
if (fs.existsSync(SESSION_FILE_PATH)) { 
    sessionCfg = require(SESSION_FILE_PATH);
}

//headless: false =>  akan menampilkan popup chromium
//headless: true =>  tidak akan menampilkan popup chromium

const init = async () => {

    const server = Hapi.server({
        port: 2000,
        host: '192.168.48.100'
    });
    server.route({
        method: 'GET',
        path: '/',
        handler: (request, h) => {
            const client = new Client({ puppeteer: { headless: true }, session: sessionCfg });
            client.initialize();
            client.on('qr', (qr) => {
                qrcode.generate(qr, {small: true});
            });
            
            // jika suskes connect
            client.on('authenticated', (session) => {
                console.log('AUTHENTICATED', session);
                sessionCfg=session;
                //jika session belum ada maka akan membuat file session baru
                fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {  
                    if (err) {
                        console.error(err);
                    }
                });
            });
            // jika auth gagal
            client.on('auth_failure', msg => {
                console.error('AUTHENTICATION FAILURE', msg);
            });
            // jika wa ready
            client.on('ready', () => {
                console.log('READY');
                  // Number where you want to send the message.
                const number = request.query.nomor;

                // Your message.
                const text = request.query.pesan;

                // Getting chatId from the number.
                // we have to delete "+" from the beginning and add "@c.us" at the end of the number.
                const chatId = number+ "@c.us";

                console.log("chatId")
                console.log(chatId)
                console.log("text")
                console.log(text)
                // Sending message.
                client.sendMessage(chatId, text);
            });
            // jika menerima pesan baru
            client.on('message', async msg => {
                // console.log('MESSAGE RECEIVED', msg);
            });
            // jika wa disconnect
            client.on('disconnected', (reason) => {
                // menghapus file sesssion diserver
                fs.unlinkSync(SESSION_FILE_PATH);
                console.log('Client was logged out', reason);
            });
            return 'Hello World!';
        }
    });
    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();