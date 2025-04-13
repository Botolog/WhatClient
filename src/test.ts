import blessed, { line, Widgets } from "blessed";


var screen: Widgets.Screen = blessed.screen({
    // dump: __dirname + '/logs/shadow.log',
    smartCSR: true,
    title: "WhatClient 0.0.1",
    // autoPadding: true,
    // dockBorders: true,
    // warnings: true,
    
});

// let big = blessed.layout({
//     parent: screen,
//     right:0,
//     top:0,
//     height: "100%",
//     width: "80%",
//     layout: "inline",
//     align: "center",
//     border: "line",
    

// })

// let o = blessed.box({
//     parent: big,
//     // top: 0,
//     left: 0,
//     // bottom: 0,
//     right: 0,
//     width: "half",
//     shrink: false,
//     height: 3,
//     border: "line",
//     content: "1",
//     style: {
//         bg: "red",
//     },

    
    
    
// })

// let t = blessed.box({
//     parent: big,
//     // top: 0,
//     left: 0,
//     // valign: "top",
//     // bottom: 0,
//     right: 0,
//     width: "100%",
//     height: 3,
//     border: "line",
//     content: "2",
//     // style: {
//     //     bg: "red"
//     // },
//     bg: "red"
// })

let g = blessed.box({
    parent: screen,
    left: 0,
    bottom: 0,
    width: "100%",
    height: 10,
    border: "line",
    bg: "yellow"
})

screen.render()
// screen.
screen.key('q', function() {
    return screen.destroy();
  });
// screen.res

// screen.on("render", (s)=>{
//     console.log("ren");
// })


screen.on("resize", (s)=>{
    // t.setContent(big.height.toString())
    // console.log("res");
    g.setContent(g.width.toString())

})


// setTimeout(()=>{

//     t.setIndex(-18)
//     t.style.bg = "blue";
    
//     screen.render()
// }, 1000)

setInterval(()=>{
    
}, 100)