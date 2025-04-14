import pkg from "whatsapp-web.js";
const { Client, MessageMedia, MessageTypes, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";
import { exit } from "process";
// import { resolve } from "path";
// import { rejects } from "assert";

// import WAWebJS from "whatsapp-web.js";
// const { MessageMedia } = require('whatsapp-web.js');

var ready = false;
export function READY() { return ready };

export const client = new Client({
    // authStrategy: new NoAuth()
    authStrategy: new LocalAuth()
});

export let readyPromise = new Promise((resolve, reject) => {

client.on("ready", async () => {
    ready = true;
    console.log("Client is ready!");
    resolve(true);

    // let chats = await client.getChats()
    // chats.forEach(chat => {
    //     console.log(chat.name);
        
    // });

});

client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on("message", async (message) => {
    // console.log(message);
    // let chat = (await client.getChatById((await message.getChat()).id._serialized))
    // chat.lastMessage
    // console.log(chat.name);

    // console.log(await chat.lastMessage.body);
    
    

})

client.on("auth_failure", (msg) => {
    console.error('AUTHENTICATION FAILURE', msg);
    reject(new Error(`Authentication failed: ${msg}`)); // Reject the promise on auth failure
    exit()
});

// console.log(client.getChatById());


client.initialize();
})

console.log("ye")
