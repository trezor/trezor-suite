/*
import * as protobuf from 'protobufjs/light';
import * as messages from '../../protobuf/messages.json';
import { receiveAndParse } from '../src/utils/receive';

const rcvd = new ArrayBuffer(64);
const rcvdView = new Uint8Array(rcvd);
rcvdView.set([63, 35, 35, 0, 2, 0, 0, 0, 2, 10], 0);

rcvdView.set([
    63, 49, 248, 2, 240, 1, 128, 3, 192, 2, 1, 240, 1, 5, 240, 1, 15, 240, 1, 16, 248, 1, 0, 128, 2,
    0, 136, 2, 0, 144, 2, 0, 160, 2, 0, 168, 2, 0, 176, 2, 192, 207, 36, 184, 2, 0, 192, 2, 0, 200,
    2, 0, 208, 2, 2, 216, 2, 0, 226, 2, 4, 84, 51, 87,
]);

const root = protobuf.Root.fromJSON(messages as protobuf.INamespace);

const i = 0;
const receiver = () => {
    console.log('called');
    return Promise.resolve(rcvd);
};

receiveAndParse(root, receiver).then(msg => {
    console.log(JSON.stringify(msg, undefined, 4));
});
*/

/* */
import noble from '@abandonware/noble';

noble.on('stateChange', state => {
    console.log('STATE', state);
    if (state === 'poweredOn') {
        noble.startScanning(undefined, false, err => {
            console.log('ERROR', err?.message);
        });
    } else {
        noble.stopScanning();
    }
});

noble.on('warning', warn => {
    console.log('WARNING', warn);
});

noble.on('discover', peripheral => {
    console.log('DISCOVERED', peripheral.address);
});

noble.on('scanStart', () => {
    console.log('SCAN START');
});

noble.on('scanStop', () => {
    console.log('SCAN STOP');
});
/* */
