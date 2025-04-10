import pkg, { NoAuth } from "whatsapp-web.js";
const { Client, MessageMedia, MessageTypes, LocalAuth} = pkg;
import qrcode from "qrcode-terminal";

// import WAWebJS from "whatsapp-web.js";
// const { MessageMedia } = require('whatsapp-web.js');


const client = new Client({
    // authStrategy: new NoAuth()
    authStrategy: new LocalAuth()
});

client.on("ready", () => {
    console.log("Client is ready!");
});

client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on("message", async (message)=>{
    console.log(message);
    
})


client.initialize();