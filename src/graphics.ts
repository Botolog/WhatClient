import blessed, { BlessedProgram, message, Widgets } from "blessed";
import { hide, number, string } from "yargs";
import { CmndsManager } from "./Cmnd";
import pkg from "whatsapp-web.js";
import { client, READY, readyPromise } from "./wweb";
import { exit, version } from "node:process";
import { H } from "./funcs";

// import blessed from "neo-blessed";
// import * as blessed from 'neo-blessed';
// const blessed = require("neo-blessed") as any;



var screen: Widgets.Screen = blessed.screen({
    // dump: __dirname + '/logs/shadow.log',
    fastCSR: true,
    smartCSR: true,
    useBCE: true,
    cursor: {
        shape: "line",
        artificial: true,
        color: "black",
        blink: true
    },
    
    title: "WhatClient 0.0.1 " + version
    // dockBorders: true,
    // warnings: true,
    
});

class Chats {
    gui: GUI;
    element: Widgets.LayoutElement;
    chats: Chat[] = [];
    selectedChat: Chat|undefined;
    num2display: number = 10;
    constructor(gui: GUI) {
        this.gui = gui
        this.element = blessed.layout({
            parent: this.gui.mainDisplay,
            top: 0,
            left: 0,
            // right: 0,
            width: "30%",
            // height: "100%",
            // border: "line",
            style: {
                bg: "green"
            },
            layout: "inline"
        })
        this.reloadChats()

        screen.on("resize", () => {
            this.calcHideShow()
            this.hideShow()
        })
    }

    reloadChats() {
        client.getChats().then((chatsFound) => {
            chatsFound.forEach(chat => {
                if (!chat.archived)
                    this.addChat(chat);
            });
            this.hideShow();
            console.log("COOOOOOOOOOOOOL");

        })
    }

    calcHideShow() {
        let h = this.element.height
        let ch = this.chats[0].element.height
        if (typeof (h) == "number" && typeof (ch) == "number")
            this.num2display = Math.floor(h / ch) - 1
    }

    hideShow() {
        // return
        let allIndexes: number[] = [];
        this.chats.forEach(ch => {
            allIndexes.push(ch.Zindex)
        });
        allIndexes.sort((a, b) => a - b)
        let indexes = allIndexes.slice(0, this.num2display + 1)
        this.chats.forEach(ch => {
            if (indexes.includes(ch.Zindex)) { ch.element.show() }
            else { ch.element.hide() }
        });
        this.gui.inputBar.setContent(indexes.join(","))
        screen.render()
    }

    addChat(chatStruct: pkg.Chat) {
        let ch = new Chat(this, chatStruct)
        ch.modIndex(this.chats.length)
        this.chats.push(ch)
    }

    selectChat(names: string[]){
        this.chats.forEach(ch => {
            ch.unselect()
        });
        let chats:Chat[] = [];
        names.forEach(nam => {
            chats = chats.concat(this.chats.filter(ch => ch.chatStruct.name.toLowerCase().includes(nam.toLowerCase())))
        })

        chats.sort((a, b)=>a.Zindex-b.Zindex)
        let chat = chats[0]
        if (chat)
            this.selectedChat = chat.select();
        else 
            this.gui.inputBar.setContent(`not found: ${names}`)
        this.gui.render()
    }

    elevateChat(chat: Chat) {
        // return
        if (chat.chatStruct.pinned) return
        this.chats.forEach(ch => {
            if (!ch.chatStruct.pinned)
                ch.modIndex(3)
        });
        chat.setIndex(3);
        this.normalizeIndexes()
        this.hideShow()
        chat.updateIndicator();
    }

    normalizeIndexes() {
        this.chats.sort((a, b) => a.Zindex - b.Zindex)
        for (let i = 0; i < this.chats.length; i++) {
            this.chats[i].setIndex(i);
        }
    }

    findChat(name: string) {
        return this.chats.find(chat => chat.chatStruct.name == name)
    }

    findChatIndex(name: string) {
        return this.chats.findIndex(chat => chat.chatStruct.name == name)
    }

    matchChat(sriID: string) {
        return this.chats.find(chat => chat.chatStruct.id._serialized == sriID)
    }

    matchChatIndex(sriID: string) {
        return this.chats.findIndex(chat => chat.chatStruct.id._serialized === sriID)
    }
}

class Chat {
    chatStruct: pkg.Chat;
    element: Widgets.BoxElement;
    manager: Chats;
    indicator: Widgets.BoxElement;
    Zindex: number = 0;
    msgcount: number = 0;
    selected: boolean = false;

    regBg: string = "red";

    constructor(manager: Chats, chatStruct: pkg.Chat) {
        this.chatStruct = chatStruct;
        this.manager = manager;

        this.element = blessed.box({
            parent: this.manager.element,
            // top: 0,
            left: 0,
            // bottom: 0,
            right: 0,
            width: "100%",
            height: 4,
            border: "line",
            content: H(chatStruct.name),
            style: {
                bg: this.regBg
            },
        })

        this.indicator = blessed.box({
            parent: this.element,
            right: 1,
            bottom: 0,
            width: "shrink",
            content: "1",
            style: {
                bg: "green"
            },
            hidden: true

        })


        // if (chatStruct.pinned)
        //     this.modIndex(-1)
        //  this.element.index -= 10

        this.updateIndicator()

        screen.render()
    }

    updateStruct(ch: pkg.Chat) {
        this.chatStruct = ch;
        this.updateIndicator()
        screen.render();
    }

    setIndex(z: number) {
        this.Zindex = z;
        this.element.setIndex(this.Zindex);
        this.updateIndicator();
    }
    modIndex(dz: number) {
        this.Zindex += dz;
        this.setIndex(this.Zindex);
    }

    updateIndicator() {
        // let msgnum = this.Zindex
        let msgnum = this.chatStruct.unreadCount
        if (msgnum <= 0) this.indicator.hide()
        else {
            this.indicator.setContent(msgnum.toString())
            this.indicator.show()
        }
        screen.render()
    }

    select() {
        this.selected = true
        this.element.style.bg = "blue"
        return this
    }

    unselect() {
        this.selected = false
        this.element.style.bg = this.regBg
        return this
    }


}

class InfoWindow{
    gui: GUI;
    element: Widgets.BoxElement;

    constructor (gui: GUI){
        this.gui = gui;
        this.element = blessed.box({
            parent: gui.mainDisplay,
            top: 0,
            right: 0,
            height: "100% - 1",
            width: `100% - ${gui.currentChats.element.width}`,
            style: {
                bg: "blue"
            },
            border: "line",

        })
    }
}

export class GUI {
    mainDisplay: Widgets.BoxElement = blessed.box({
        parent: screen,
        top: 0,
        left: 0,
        // right: 0,
        // width: "100%",
        height: "100%-5",
        border: "line",
        style: {
            bg: "yellow"
        }

    });

    inputBar: Widgets.BoxElement;
    input: Widgets.TextboxElement;

    normalChats: Chats = new Chats(this);
    currentChats: Chats;

    currentInfo: InfoWindow;

    constructor() {
        
        this.inputBar = blessed.box({
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
            parent: this.inputBar,
            bottom: 0,
            right: 0,
            width: "30%",
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
        this.currentChats = this.normalChats;
        this.currentInfo = new InfoWindow(this);

        this.input.on("focus", () => {
            this.input.readInput();

        })

        this.input.key("up", () => {
            this.input.setValue(H(cmnds.before()))
            screen.render()
        })
        this.input.key("down", () => {
            this.input.setValue(H(cmnds.after()))
            screen.render()
        })

        this.input.key("return", async () => {
            cmnds.return(this.input.getText())
            this.input.clearValue()
            this.input.focus()

            screen.render()

        })
        this.input.focus()
        this.render()
    }

    warn(txt: string){
        this.mainDisplay
    }

    render() {
        screen.render();
    }
}


var cmnds:CmndsManager;
readyPromise.then(() => {

    let Gui = new GUI()
    cmnds = new CmndsManager(Gui)

    client.on("message_create", async (message) => {
        // let chat = Gui.normalChats.matchChat((await message.getChat()).id._serialized)
        // if (chat != undefined) {
        //     Gui.normalChats.elevateChat(chat)
        // }

        message.getChat().then((ch)=>{
            let chat = Gui.normalChats.matchChat(ch.id._serialized)
            if (chat != undefined) {
                Gui.normalChats.elevateChat(chat)
            }
        })
    })

    client.on("unread_count", (ch)=>{
        let chat = Gui.normalChats.matchChat(ch.id._serialized)
        if (chat != undefined) {
            chat.updateStruct(ch);
        }
        else {
            // console.log(ch);
            // exit()   
        }
    })


    // setInterval(Gui.render, 500)
    // client.getChats().then((chats)=>{
    //     console.log(chats);

    // }).catch((res)=>{
    //     console.error(res);

    // })
    setTimeout(() => {

        // Gui.chats.chats.push(new Chat(Gui.chats))
        // Gui.chats.chats.push(new Chat(Gui.chats))
    }, 1000)
})

