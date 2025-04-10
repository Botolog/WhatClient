import blessed, { line, Widgets } from "blessed";


var screen: Widgets.Screen = blessed.screen({
    // dump: __dirname + '/logs/shadow.log',
    smartCSR: true,
    title: "WhatClient 0.0.1",
    autoPadding: true,
    // dockBorders: true,
    // warnings: true,
    
});

let big = blessed.layout({
    parent: screen,
    left:0,
    top:0,
    height: "100%",
    width: "100%",
    layout: "inline",
    align: "center",
    border: "line",

})

blessed.box({
    parent: big,
    // top: 0,
    left: 0,
    // bottom: 0,
    right: 0,
    width: "half",
    shrink: false,
    height: 3,
    border: "line",
    content: "1",
    style: {
        bg: "red",
    },
    
    
    
})

blessed.box({
    parent: big,
    // top: 0,
    left: 0,
    // valign: "top",
    // bottom: 0,
    right: 0,
    width: "half",
    height: 3,
    border: "line",
    content: "2",
    style: {
        bg: "red"
    }
    
})

screen.render()