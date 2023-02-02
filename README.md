
#### Set MongoDB
In here, use mongodb-win32-i386-3.2.1.
Please create folder in C Drive tree like this.
```C:\MongoDB
      |
      |-DB
      |-Log```

In this EasyRTCWeb git, run start.bat in MongoDB Setting folder.
  ```run start.bat```
  

#### Change the permissions of upload directory
  ```sudo chmod 777 installed_path/public/avatars```

#### Run
To run this server, in the root of the project directory run 

```node server.js```