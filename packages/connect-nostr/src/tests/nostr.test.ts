import { ServerOptions, WebSocket } from 'ws';

import { NostrClient } from '../index';



class Server extends WebSocket.Server {
    private _url: string;
    fixtures?: any[];

    constructor(options: ServerOptions, callback?: () => void) {
        super(options, callback);

        this._url = `ws://localhost:${options.port}`;
        this.on('connection', ws => {
            ws.on('message', data => this.sendResponse(ws, data));
        });
    }

    public getUrl() {
        return this._url;
    }

    private sendResponse(client: WebSocket, data: any) {
        const request = JSON.parse(data);
        const [TYPE, ...payload] = request;
        let response;

        if (TYPE === 'EVENT') {
            response = { success: true, payload };
        }

        if (!response) {
            response = {
                success: false,
                error: { message: `unknown response for method ${TYPE}` },
            };
        }

        console.log('response', response);

        client.send(JSON.stringify({ ...response }));
    }
}

const createServer = async () => {
    const port = 12345;
    const server = new Server({ port });
    await new Promise<void>((resolve, reject) => {
        server.once('listening', () => resolve());
        server.once('error', error => reject(error));
    });

    return { server, url: `ws://localhost:${port}` };
};

describe('Initialize NostrClient', () => {
    let server: Server;
    beforeAll(async () => {
        const r = await createServer();
        server = r.server;
    });

    afterAll(() => {
        server.close();
    });

    // it('NostrClient connects to relay', (done) => {
    //     const nostrClient = new NostrClient({
    //         type: 'hot-keys',
    //         nsecStr: 'nsec12rfalrsa6dvnxjhhf4n0d2k4rc2wc8hy49qvp34k2hj8p7cppnnq8ysujz',
    //         relayUrl: server.getUrl(),
    //         // relayUrl: 'wss://relay.primal.net',
    //     });

    //     nostrClient.on('status', event => {
    //         console.log('event', event);
    //         const {relayConnection, identity} = event;
    //         if (relayConnection === 'connected') {
    //             console.log('it should be done!!');
    //             expect(identity.nsecStr).toEqual(nostrClient.getIdentity().nsecStr);
    //             done();
    //         }
    //     });

    //     nostrClient.connect();
    // });

    it('NostrClient sends event to relay', (done) => {
        const nostrClient = new NostrClient({
            type: 'hot-keys',
            nsecStr: 'nsec12rfalrsa6dvnxjhhf4n0d2k4rc2wc8hy49qvp34k2hj8p7cppnnq8ysujz',
            relayUrl: server.getUrl(),
            // relayUrl: 'wss://relay.primal.net',
        });

        nostrClient.on('event', message => {
            console.log('message', message);
            const { content } = message;
            console.log('content', content);
            // expect(content).toBe('Hello from mock server'); // Check if the content is as expected
            // done(); // Indicate that the test is complete
        });


        nostrClient.on('status', event => {
            console.log('event', event);
            const {relayConnection} = event;
            if (relayConnection === 'connected') {
                const peerNpub = 'npub1s2lkl5jwf86dm75qqe3amvaxvsyf825frhuu6w7207ykjn6qrg7slyut44';

                nostrClient.request({
                    // TODO: This kind does not exist yet.
                    kind: 9898,
                    tags: [['p', peerNpub]],
                    content: JSON.stringify({
                        type: 'address_request',
                    }),
                });
                // console.log('it should be done!!');
                // done();
            };
        });

        nostrClient.connect();
        
    });
});
