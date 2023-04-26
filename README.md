# Description
This package is used to monitor changes to local files and update the server in real-time.remote-file-sync.

# Installation
`npm i rfsc -g`

# Examples
Configure rfscconfig.json
```json
    {
        "watchDir": "./monitor", 
        "targetDir": "C:\\project", 
        "connectConfig": {
            "host": "127.0.0.1",
            "username": "Administrator",
            "password": "password"
        },
        "ignoreFile": [".github", ".gitignore", "test"]
    }
```
Configuration details  
> `watchDir` : Files or folders that need to be listened to, default to the current directory.  
> `targetDir` : Need to push to the target folder on the target computer.  
> `connectConfig` : Configure Server Login.  
>> `host` : Host of the server.  
>> `username` : User name, most default to Administrator.  
>> `password` : Password.  
> `ignoreFile` : Files that need to be monitored and ignored.  
# Start Project
`rfsc` 