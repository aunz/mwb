```shell
npm run mwb initFull
```

This add react, react-dom, redux and page into your app. The command also create some default folders and files

```
App  
 └─ /src/ 
     ├─ /client/
     |    ├─ main.js
     |    └─ entry.js
     ├─ /server/
     |    ├─ entry.js
     |    ├─ app.js 
     |    └─ main.js
     └─ /share/
          ├─ /actions/
          └─ /Components/
               ├─ /constants
               ├─ /reducers/
               ├─ html.js
               ├─ index.html
               ├─ initialState.js
               └─ routes.js

```

The main.js contains examples how to do [univserval routing](./universal_routes) for client and server

Write your inital html in the index.html, put variables insides {{}}, e.g. {{appTitle}}, {{name}}, {{data}}.

The html.js will require the index.html via raw-loader, inject script and style link for client.

You can then import html.js as your template in the server