const express = require('express')
const app = express();
const port = 30001;
const { v4: uuidv4 } = require('uuid');

// {
//     "kind": "drive#fileList",
//     "incompleteSearch": false,
//     "files": [
//      {
//       "kind": "drive#file",
//       "id": "1GNw6ZDWv9Uczkm4eU0z2RTmLXbPH-zm9Arqj3FexmO6JCubm2w",
//       "name": "2b462a0a98606521f153662e55016982edab2fcedae176ca35ef05fba2350219.mtdt",
//       "mimeType": "text/plain"
//      },

class File {
    constructor(id, name, data) {
        this.id = id,
        this.name = name;
        this.mimeType = "text/plain",
        this.kind = "drive#file",
        this.data = data;
    }

    toJSON() {
        return {
            name: this.name,
            id: this.id,
            mimeType: "text/plain",
            kind: "drive#file",
        }
    }
}

const BOUNDARY = '---------314159265358979323846';

class GoogleMock {
    constructor() {
        this.reset();

        const app = express();
        

        const handleSave = (rawBody, id) => {
            console.log('==== handleSave', id, rawBody);
            
            const parts = rawBody.replace(/\r\n/g, '');
            const textContentType = 'Content-Type: text/plain;charset=UTF-8';
            const data = rawBody.substring(
                rawBody.indexOf(textContentType) + textContentType.length,
                rawBody.indexOf('---------314159265358979323846--'),
            ).replace(/\r?\n|\r/g, '');
            
            const jsonContentType = 'Content-Type: application/json';
            const jsonStr = rawBody.substring(
                rawBody.indexOf(jsonContentType) + jsonContentType.length,
                rawBody.indexOf(BOUNDARY, BOUNDARY.length),
            ).replace(/\r?\n|\r/g, '');
            
            console.log('jsonStr', jsonStr);
            const json = JSON.parse(jsonStr);
            console.log('this.files', this.files[0].id, typeof this.files[0].id);
            if (id) {
                const index = this.files.findIndex(f => f.id == id);
                console.log('index', index);
                if (index === -1) throw new Error('no such file exists');
                this.files[index].data = data; 

            } else {
                this.files.push(new File(
                    uuidv4(),
                    json.name,
                    data,
                ));
            }

            console.log(this.files);

        }

        app.use((req, res, next) => {
            if (!this.user) {
                res.status(401);
                res.send();
                return;
            }
            return next();
        })

        app.post('/upload/drive/v3/files', express.text({ type: '*/*'}), (req, res) => {
            console.log('[mockGoogleDrive]: post');

            handleSave(req.body);
            res.send();
        });


        app.patch('/upload/drive/v3/files/:id', express.text({ type: '*/*'}), (req, res) => {
            console.log('[mockGoogleDrive]: patch', req.params.id);

            handleSave(req.body, req.params.id);
            res.send();
        })

        // app.use(express.json());

        app.get('/drive/v3/files/:id', express.json(), (req, res) => {
            const id = req.params.id;
            console.log('[mockGoogleDrive]: get', req.params.id);
            const file = this.files.find(f => f.id);
            if(file) {
                return res.send(file.data);
            }
            res.status(404);
            res.send({
                error: {
                    code: 404,
                    message: `File not found for ${id}`
                }
            })
            
            res.send();
        });

        app.get('/drive/v3/files', express.json(), (req, res) => {
            res.json({
                files: this.files,
            });
        });

        app.get('/drive/v3/about', express.json(), (req, res) => {
            console.log('[mockGoogleDrive]: about');
            res.send(
                {
                    user: this.user,
                }
            )
        })
        
        this.app = app;

    }

    start() {
        if (this.running) {
            this.reset();
            return;
        };

        console.log('[mockGoogleDrive]: start');

        return new Promise((resolve, reject) => {
            this.app.listen(port, (server) => {
                console.log(`Example app listening at http://localhost:${port}`);
                this.running = true;
                this.server = server;
                resolve();
            });
        })
        
    }

    stop() {
        console.log('[mockGoogleDrive]: start');
        if (this.server) {
            this.server.close();
        }
    }

    reset() {
        console.log('[mockGoogleDrive]: reset');

        this.files = [
            new File(
                '13DH0FwzmGHmf2sWRBIvyJ9WJlkKTgL-KKamv-oqw6fvKqcQYGA',
                'f7acc942eeb83921892a95085e409b3e6b5325db6400ae5d8de523a305291dca.mtdt',
                'fbace4e987076329426cc882058f8101dd99f1187cf075f9c76a4fedfa962fc5e34c55449fe4539d99dc31e83bff8084552416b43902500c9df9164ba84cf1845aaca0b7b70ec5a4ff90b83f6bb0d7e2ad0f215ec6aea65f5448534c17493d8ae150aa3e871e60b1978b68',
            )
        ]
        this.user = {
            kind: "drive#user",
            displayName: "Kryptonit",
        }
    }

    setup(prop, value) {
        console.log('[mockGoogleDrive]: setup ', prop, value);

        this[prop] = value;
        console.log('[mockGoogleDrive] ', this[prop]);
    }
}

const googleMock = new GoogleMock();

// googleMock.start();

module.exports = googleMock;