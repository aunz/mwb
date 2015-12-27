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
          ├─ /Components/
     			├─ /constants
     			├─ /reducers/
     			├─ html.js
     			├─ index.html
     			├─ initialState.js
     			└─ routes.js

```

The main.js contains examples how to do [univserval routing](./universal_routes) for client and server