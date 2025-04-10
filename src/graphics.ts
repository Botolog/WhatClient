import blessed, { Widgets } from "blessed";
import { number, string } from "yargs";
import { Cmnds, H } from "./Cmnd";
import pkg from "whatsapp-web.js";
import { client, READY, readyPromise } from "./wweb";

// import blessed from "neo-blessed";
// import * as blessed from 'neo-blessed';
// const blessed = require("neo-blessed") as any;


var cmnds = new Cmnds()

var screen: Widgets.Screen = blessed.screen({
    // dump: __dirname + '/logs/shadow.log',
    smartCSR: true,
    title: "WhatClient 0.0.1"
    // dockBorders: true,
    // warnings: true,
});

class Chats{
    gui: GUI;
    element: Widgets.LayoutElement;
    chats:Chat[] = [];
    constructor(gui:GUI){
        this.gui = gui
        this.element = blessed.layout({
            parent: this.gui.display,
            top: 0,
            left: 0,
            // right: 0,
            width: "30%",
            // height: "100%",
            border: "line",
            style: {
                bg: "green"
            },
            layout: "inline"
        })
        client.getChats().then((chatsFound)=>{
            chatsFound.forEach(chat => {
                this.addChat(chat);
            });
        })
        // this.chats.push(new Chat(this, "ye"))
    }

    addChat(chatStruct: pkg.Chat){
        this.chats.push(new Chat(this, chatStruct))
    }
}

class Chat{
    chatStruct:pkg.Chat;
    element: Widgets.BoxElement;
    manager: Chats;
    constructor(manager:Chats, chatStruct: pkg.Chat){
        this.chatStruct = chatStruct;
        this.manager = manager;
        
        this.element = blessed.box({
            parent: this.manager.element,
            // top: 0,
            left: 0,
            // bottom: 0,
            right: 0,
            width: "90%",
            height: 3,
            border: "line",
            content: H(chatStruct.name),
            style: {
                bg: "red"
            },            
        })
        
        screen.render()
    }

}

class GUI {
    

    display: Widgets.BoxElement= blessed.box({
        parent: screen,
        top: 0,
        left: 0,
        // right: 0,
        // width: "100%",
        height: "82%",
        border: "line",
        style: {
            bg: "yellow"
        }
    
    });

    input: Widgets.TextboxElement;

    chats: Chats = new Chats(this);

    constructor() {
        
        let inputBar = blessed.box({
            parent: screen,
            bottom: 0,
            left: 0,
            width: "100%",
            height: "shrink",
            border: "line",
            style: {
                bg: "yellow"
            },
            mouse: true,
            keys: true,
        
            input: true,
            focusable: true,
        })
        this.input = blessed.textbox({
            parent: inputBar,
            bottom: 0,
            right: 0,
            width: "90%",
            height: "shrink",
            border: "line",
            style: {
                bg: "blue"
            },
            mouse: true,
            keys: true,
        
            input: true,
            focusable: true,
            // clickable:true,
        })
        
        this.input.on("focus", () => {
            this.input.readInput();
        
        })
        
        this.input.key("up", () => {
            this.input.setValue(cmnds.before())
            screen.render()
        })
        this.input.key("down", () => {
            this.input.setValue(cmnds.after())
            screen.render()
        })
        
        this.input.key("return", async () => {
            cmnds.add(this.input.getText())
            this.input.clearValue()
            this.input.focus()
        
            screen.render()
        
        })
        this.input.focus()
        this.render()
    }

    render(){
        screen.render();
    }
}

readyPromise.then(()=>{

    let Gui = new GUI()
    
    setInterval(Gui.render, 500)
    setTimeout(()=>{

        // Gui.chats.chats.push(new Chat(Gui.chats))
        // Gui.chats.chats.push(new Chat(Gui.chats))
    }, 1000)
})

