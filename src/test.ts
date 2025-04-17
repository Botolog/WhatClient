import blessed, { line, Widgets } from "blessed";


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



// import pkg from "whatsapp-web.js";
// const { Client, MessageMedia, MessageTypes, LocalAuth } = pkg;
// import qrcode from "qrcode-terminal";
// import { exit } from "process";
// // import { resolve } from "path";
// // import { rejects } from "assert";

// // import WAWebJS from "whatsapp-web.js";
// // const { MessageMedia } = require('whatsapp-web.js');


// export const client = new Client({
//     // authStrategy: new NoAuth()
//     authStrategy: new LocalAuth()
// });


// client.on("ready", async () => {
//     console.log("Client is ready!");

//     // let chats = await client.getChats()
//     // chats.forEach(chat => {
//     //     console.log(chat.name);

//     // });

// });

// client.on("qr", (qr) => {
//     qrcode.generate(qr, { small: true });
// });

// client.on("message_create", async (message) => {
//     // console.log(message);
//     // let chat = (await client.getChatById((await message.getChat()).id._serialized))
//     // chat.lastMessage
//     // console.log(chat.name);

//     // console.log(await chat.lastMessage.body);

// })

// client.on("unread_count", (chat)=>{
//     console.log(chat.name, chat.unreadCount);

// })



// // client.on("m")

// client.on("auth_failure", (msg) => {
//     console.error('AUTHENTICATION FAILURE', msg); // Reject the promise on auth failure
//     exit()
// });

// // console.log(client.getChatById());


// client.initialize();

// console.log("ye")







// class MyClass {
//     public property1 = "hello";
//     private property2 = 123;

//     public method1() {
//         console.log("Method 1 called");
//     }

//     private method2() {
//         console.log("Method 2 called");
//     }

//     public static staticMethod() {
//         console.log("Static method called");
//     }
// }

// const instance = new MyClass();

// function getInstanceFunctions(obj: MyClass): string[] {
//     return Object.getOwnPropertyNames(Object.getPrototypeOf(obj)).filter(
//         (propertyName) => typeof obj[propertyName] === 'function' && propertyName !== 'constructor'
//     );
// }

// function getStaticFunctions(clazz: any): string[] {
//     return Object.getOwnPropertyNames(clazz).filter(
//         (propertyName) => typeof clazz[propertyName] === 'function'
//     );
// }

// console.log("Functions of instance:", getInstanceFunctions(instance));
// console.log("Functions of class (static methods):", getStaticFunctions(MyClass));
















// class MyClass {
//     constructor(private id: number) {
//         console.log(`MyClass instance ${this.id} created.`);
//     }

//     // Read function (no arguments)
//     read(): void {
//         console.log(`Instance ${this.id}: Reading data...`);
//     }

//     // Print function (two number arguments)
//     print(arg1: number, arg2: number): void {
//         const sum = arg1 + arg2;
//         console.log(`Instance ${this.id}: Printing - Arg1: ${arg1}, Arg2: ${arg2}, Sum: ${sum}`);
//     }

//     // Example function expecting a string
//     greet(message: string): string {
//         const result = `Instance ${this.id} says: ${message}`;
//         console.log(result);
//         return result;
//     }

//     // Example private property (to show it won't be listed easily by simple checks)
//     private secret: string = "internal detail";
// }

// /**
//  * Executes a method on a class instance based on a command string.
//  *
//  * @param instance - The class instance to operate on.
//  * @param commandString - The command string, e.g., "print 2 3" or "read".
//  * @returns The result of the called method, or undefined if the method returns void or fails.
//  */
// function executeCommand(instance: any, commandString: string): any {
//     console.log(`\n--- Executing command: "${commandString}" ---`);

//     // 1. Parse the command string
//     const parts = commandString.trim().split(/\s+/); // Split by one or more whitespace characters
//     if (parts.length === 0 || parts[0] === '') {
//         console.error("Error: Command string is empty.");
//         return;
//     }

//     const methodName = parts[0];
//     const stringArgs = parts.slice(1);

//     // 2. Check if the method exists and is a function on the instance or its prototype
//     // Using bracket notation accesses the property. `typeof` checks if it's a function.
//     // This automatically checks the instance and its prototype chain.
//     if (typeof instance[methodName] !== 'function') {
//         console.error(`Error: Method "${methodName}" not found or is not callable on the instance.`);

//         // Optional: Use getOwnPropertyNames/getPrototypeOf for diagnostics as requested
//         console.log("Instance properties:", Object.getOwnPropertyNames(instance));
//         const proto = Object.getPrototypeOf(instance);
//         if (proto && proto !== Object.prototype) {
//             console.log(`Prototype (${proto.constructor.name}) properties:`, Object.getOwnPropertyNames(proto));
//         }
//         // Note: 'constructor' is usually on the prototype but typeof instance['constructor'] !== 'function'
//         // because it refers to the class itself, not a typical callable method instance.

//         return; // Exit if method is not valid
//     }

//     // 3. Prepare arguments (basic type conversion example: try converting to number)
//     // WARNING: This is a naive conversion. A real-world scenario might need
//     // more sophisticated type checking or parsing based on expected method signatures.
//     const processedArgs = stringArgs.map(arg => {
//         const num = Number(arg);
//         // If conversion to number results in NaN, keep the original string,
//         // otherwise use the number. This allows methods like 'greet' to work.
//         return isNaN(num) ? arg : num;
//     });

//     // 4. Call the method dynamically
//     try {
//         // Use bracket notation to access the method by name
//         // Use the spread syntax (...) to pass the processed arguments individually
//         console.log(`Calling ${methodName} with arguments:`, processedArgs);
//         const methodToCall = instance[methodName];
//         const result = methodToCall.apply(instance, processedArgs); // or instance[methodName](...processedArgs)

//         // Using .apply() or the spread syntax (...) achieves the goal:
//         // - .apply(instance, processedArgs) explicitly sets 'this' and takes args as an array.
//         // - instance[methodName](...processedArgs) uses spread syntax, which is often cleaner. Both work.

//         console.log(`Method "${methodName}" executed successfully.`);
//         if (result !== undefined) {
//             console.log("Method returned:", result);
//         }
//         return result; // Return the result
//     } catch (error) {
//         console.error(`Error executing method "${methodName}":`, error);
//         // This catches errors thrown *inside* the called method (e.g., print expecting numbers but getting undefined)
//     }
// }

// // --- Example Usage ---
// const instance1 = new MyClass(1);
// const instance2 = new MyClass(2);

// executeCommand(instance1, "read");          // Calls instance1.read()
// executeCommand(instance1, "print 10 25");   // Calls instance1.print(10, 25)
// executeCommand(instance2, "print 5 8");     // Calls instance2.print(5, 8)
// executeCommand(instance2, "greet Hello TypeScript"); // Calls instance2.greet("Hello TypeScript")
// executeCommand(instance1, "greet Another message 123"); // Calls instance1.greet("Another message 123") - note 123 stays string

// // --- Edge cases and errors ---
// executeCommand(instance1, "  print  100   200  "); // Handles extra spacing
// executeCommand(instance1, "read 1 2 3");      // Calls read(), ignores extra args
// executeCommand(instance1, "print 50");        // Calls print(50, undefined) -> likely causes error or NaN inside print
// executeCommand(instance1, "nonExistentMethod"); // Error: Method not found
// executeCommand(instance1, "constructor");     // Error: 'constructor' is not typically directly callable this way
// executeCommand(instance1, "secret");          // Error: 'secret' is not a function
// executeCommand(instance1, "");                // Error: Empty command














let program = blessed.program();

process.title = 'blessed';

program.on('keypress', function(ch, key) {
  if (key.name === 'q') {
    program.clear();
    program.disableMouse();
    program.showCursor();
    program.normalBuffer();
    process.exit(0);
  }
});

program.on('mouse', function(data) {
  if (data.action === 'mouseup') return;
  program.move(1, program.rows);
  program.eraseInLine('right');
  if (data.action === 'wheelup') {
    program.write('Mouse wheel up at: ' + data.x + ', ' + data.y);
  } else if (data.action === 'wheeldown') {
    program.write('Mouse wheel down at: ' + data.x + ', ' + data.y);
  } else if (data.action === 'mousedown' && data.button === 'left') {
    program.write('Left button down at: ' + data.x + ', ' + data.y);
  } else if (data.action === 'mousedown' && data.button === 'right') {
    program.write('Right button down at: ' + data.x + ', ' + data.y);
  } else {
    program.write('Mouse at: ' + data.x + ', ' + data.y);
  }
  program.move(data.x, data.y);
  program.bg('red');
  program.write(' ');
  program.bg('!red');
});

program.on('focus', function() {
  program.move(1, program.rows);
  program.write('Gained focus.');
});

program.on('blur', function() {
  program.move(1, program.rows);
  program.write('Lost focus.');
});

program.alternateBuffer();
program.enableMouse();
program.hideCursor();
program.clear();

program.move(1, 1);
program.bg('black');
program.write('Hello world');
program.setx((program.cols / 2 | 0) - 4);
program.down(5);
program.write('Hi again!');
program.bg('!black');
program.feed();

program.getCursor(function(err:any, data:any) {
  if (!err) {
    program.write('Cursor is at: ' + data.x + ', ' + data.y + '.');
    program.feed();
  }

  program.charset('SCLD');
  program.write('abcdefghijklmnopqrstuvwxyz0123456789');
  program.charset('US');
  program.setx(1);
});