// import blessed, { line, Widgets } from "blessed";


// var screen: Widgets.Screen = blessed.screen({
//     // dump: __dirname + '/logs/shadow.log',
//     smartCSR: true,
//     title: "WhatClient 0.0.1",
//     // autoPadding: true,
//     // dockBorders: true,
//     // warnings: true,
    
// });

// // let big = blessed.layout({
// //     parent: screen,
// //     right:0,
// //     top:0,
// //     height: "100%",
// //     width: "80%",
// //     layout: "inline",
// //     align: "center",
// //     border: "line",
    

// // })

// // let o = blessed.box({
// //     parent: big,
// //     // top: 0,
// //     left: 0,
// //     // bottom: 0,
// //     right: 0,
// //     width: "half",
// //     shrink: false,
// //     height: 3,
// //     border: "line",
// //     content: "1",
// //     style: {
// //         bg: "red",
// //     },

    
    
    
// // })

// // let t = blessed.box({
// //     parent: big,
// //     // top: 0,
// //     left: 0,
// //     // valign: "top",
// //     // bottom: 0,
// //     right: 0,
// //     width: "100%",
// //     height: 3,
// //     border: "line",
// //     content: "2",
// //     // style: {
// //     //     bg: "red"
// //     // },
// //     bg: "red"
// // })

// let g = blessed.box({
//     parent: screen,
//     left: 0,
//     bottom: 0,
//     width: "100%",
//     height: 10,
//     border: "line",
//     bg: "yellow"
// })

// screen.render()
// // screen.
// screen.key('q', function() {
//     return screen.destroy();
//   });
// // screen.res

// // screen.on("render", (s)=>{
// //     console.log("ren");
// // })


// screen.on("resize", (s)=>{
//     // t.setContent(big.height.toString())
//     // console.log("res");
//     g.setContent(g.width.toString())

// })


// // setTimeout(()=>{

// //     t.setIndex(-18)
// //     t.style.bg = "blue";
    
// //     screen.render()
// // }, 1000)

// setInterval(()=>{
    
// }, 100)



import pkg from "whatsapp-web.js";
const { Client, MessageMedia, MessageTypes, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";
import { exit } from "process";
// import { resolve } from "path";
// import { rejects } from "assert";

// import WAWebJS from "whatsapp-web.js";
// const { MessageMedia } = require('whatsapp-web.js');


export const client = new Client({
    // authStrategy: new NoAuth()
    authStrategy: new LocalAuth()
});


client.on("ready", async () => {
    console.log("Client is ready!");

    // let chats = await client.getChats()
    // chats.forEach(chat => {
    //     console.log(chat.name);
        
    // });

});

client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on("message_create", async (message) => {
    // console.log(message);
    // let chat = (await client.getChatById((await message.getChat()).id._serialized))
    // chat.lastMessage
    // console.log(chat.name);

    // console.log(await chat.lastMessage.body);
    
})

client.on("unread_count", (chat)=>{
    console.log(chat.name, chat.unreadCount);
    
})



// client.on("m")

client.on("auth_failure", (msg) => {
    console.error('AUTHENTICATION FAILURE', msg); // Reject the promise on auth failure
    exit()
});

// console.log(client.getChatById());


client.initialize();

console.log("ye")
