import blessed, { message, Widgets } from "blessed";
import { hide, number, string } from "yargs";
import { Cmnds, H } from "./Cmnd";
import pkg from "whatsapp-web.js";
import { client, READY, readyPromise } from "./wweb";
import { version } from "node:process";

// import blessed from "neo-blessed";
// import * as blessed from 'neo-blessed';
// const blessed = require("neo-blessed") as any;


var cmnds = new Cmnds()

var screen: Widgets.Screen = blessed.screen({
    // dump: __dirname + '/logs/shadow.log',
    smartCSR: true,
    title: "WhatClient 0.0.1 " + version
    // dockBorders: true,
    // warnings: true,
});

class Chats {
    gui: GUI;
    element: Widgets.LayoutElement;
    chats: Chat[] = [];
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

    reloadChats(){
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
        this.chats.sort((a, b)=>a.Zindex-b.Zindex)
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
            height: 3,
            border: "line",
            content: H(chatStruct.name),
            style: {
                bg: "red"
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

    setIndex(z: number) {
        this.Zindex = z;
        this.element.setIndex(this.Zindex)
        this.updateIndicator();
    }
    modIndex(dz: number) {
        this.Zindex += dz;
        this.element.setIndex(this.Zindex)
        this.updateIndicator();
    }

    updateIndicator() {
        // let msgnum = this.Zindex
        let msgnum = this.chatStruct.unreadCount
        if (msgnum <= 0) this.indicator.hide()
        else {
            this.indicator.setContent(msgnum.toString())
            this.indicator.show()
        }
    }


}

class GUI {


    mainDisplay: Widgets.BoxElement = blessed.box({
        parent: screen,
        top: 0,
        left: 0,
        // right: 0,
        // width: "100%",
        height: "100%-10",
        border: "line",
        style: {
            bg: "yellow"
        }

    });

    inputBar: Widgets.BoxElement;
    input: Widgets.TextboxElement;

    normalChats: Chats = new Chats(this);

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
            cmnds.add(this.input.getText())
            this.input.clearValue()
            this.input.focus()

            screen.render()

        })
        this.input.focus()
        this.render()
    }

    render() {
        screen.render();
    }
}

readyPromise.then(() => {

    let Gui = new GUI()

    client.on("message_create", async (message) => {
        let chat = Gui.normalChats.matchChat((await message.getChat()).id._serialized)
        if (chat != undefined)
            Gui.normalChats.elevateChat(chat)
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

