import { exit } from "process";
import yargs from "yargs";
import { GUI } from "./graphics";
import { conv2heb } from "./funcs";
import { writeFile } from "fs";


export class CmndsManager {
    history: string[] = []
    step: number = -1
    cmnds: any;
    gui: GUI;

    constructor(gui: GUI) {
        this.gui = gui;
        this.cmnds = new Cmnds(this.gui)
    }

    return(txt: string) {
        this.history.unshift(txt);
        this.step = -1
        try {
            this.executeCommand(txt);
        } catch (error) {
            writeFile("log", `${error}`, "utf8", ()=>{})
        }
        this.gui.render()
    }

    executeCommand(commandString: string): any {
        const parts = commandString.trim().split(/\s+/); // Split by one or more whitespace characters
        if (parts.length === 0 || parts[0] === '') {
            return;
        }

        const funcName = parts[0];
        const stringArgs = parts.slice(1);

        switch (funcName) {
            case "ch":
                this.cmnds.ch(stringArgs[0])
                break;
            case "render":
                this.gui.render();
                break;
            case "exit":
                exit();
        }
        

        // if (typeof this.cmnds[methodName] !== 'function') {
        //     return; // Exit if method is not valid
        // }

        // const processedArgs = stringArgs.map(arg => {
        //     const num = Number(arg);
        //     return isNaN(num) ? arg : num;
        // });

        // const methodToCall = this.cmnds[methodName];
        // const result = methodToCall.apply(this.cmnds, processedArgs); // or instance[methodName](...processedArgs)

        // return result; // Return the result

    }

    get() {
        if (this.step < 0) return ""
        // console.log(this.step);
        return this.history[this.step]
        return ""
    }

    after() {
        this.step = Math.max(this.step - 1, -1)
        return this.get()
    }

    before() {
        this.step = Math.min(this.step + 1, this.history.length - 1)
        return this.get()
    }
}

class Cmnds {
    gui: GUI;

    constructor(gui: GUI) {
        this.gui = gui;
    }

    ch(name: string) {
        this.gui.currentChats.selectChat([name].concat(conv2heb(name)))
    }

    say(txt: string) {
        this.gui.currentInfo.element.setContent(txt)
        this.gui.render()
    }



    exit() {
        exit()
    }
}

// class Cmnd{
//     imp: Function;
//     name: string;

//     constructor(name:string, fun: Function) {
//         this.name = name;
//         this.imp = fun;
//     }

//     exec(a:any, b:any, c:any, d:any){
//         this.imp(a, b, c, d)
//     }
// }




//   // Example usage:
//   const text1 = "123 asd שדג";
//   const reversedText1 = H(text1);
//   console.log(`Original: "${text1}"`);
//   console.log(`Reversed: "${reversedText1}"`); // Output: Reversed: "123 asd גדש"

//   const text2 = "Hello עולם!";
//   const reversedText2 = H(text2);
//   console.log(`Original: "${text2}"`);
//   console.log(`Reversed: "${reversedText2}"`); // Output: Reversed: "Hello םלוע!"

//   const text3 = "abc דגא xyz";
//   const reversedText3 = H(text3);
//   console.log(`Original: "${text3}"`);
//   console.log(`Reversed: "${reversedText3}"`); // Output: Reversed: "abc אגד xyz"

//   const text4 = "שלום world שלום";
//   const reversedText4 = H(text4);
//   console.log(`Original: "${text4}"`);
//   console.log(`Reversed: "${reversedText4}"`); // Output: Reversed: "םולש world םולש"

//   const text5 = "!@#$%^&*()_+=-`~[]{};':\",./<>?";
//   const reversedText5 = H(text5);
//   console.log(`Original: "${text5}"`);
//   console.log(`Reversed: "${reversedText5}"`); // Output: Reversed: "!@#$%^&*()_+=-`~[]{};':\",./<>?"

//   const text6 = "English only";
//   const reversedText6 = H(text6);
//   console.log(`Original: "${text6}"`);
//   console.log(`Reversed: "${reversedText6}"`); // Output: Reversed: "English only"

// const text7 = "שלום-לכם אנשים";
// const reversedText7 = H1(text7);
// console.log(`Original: "${text7}"`);
// console.log(`Reversed: "${reversedText7}"`); // Output: Reversed: "123"