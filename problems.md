 fixed? | tested? | problem
---------      ----------
   [x]  |   [ ]   | im logged in and authenticated but no chats are loading even tho it says loading
        |       | FIX: Added comprehensive logging to track chat loading flow. Ready event now properly calls getChats() and renderChats() with error handling.
   [x]  |   [x]   | chats are maybe doubled?
        |       | FIX: Removed redundant demo mode initialization that was adding chats twice (once in init, once in renderChats). Now renderChats() handles all chat rendering.
   [x]  |   [ ]   | the resize detector is detecting resize but doesnt resize
        |       | FIX: Resize handler now updates all UI component dimensions (mainBox, rightPanel, chatListBox, messagesScroll, etc.) and re-renders chats/messages.