/* @flow */

import { RippleAPI } from 'ripple-lib';
import * as MESSAGES from '../../constants/messages';
import * as RESPONSES from '../../constants/responses';
import type { Message } from '../../types/messages';
import type { Response } from '../../types/responses';

declare function postMessage(data: Response): void;

// WebWorker message handling
// eslint-disable-next-line no-undef
onmessage = (event: {data: Message}) => {
    if (!event.data) return;

    console.log('RippleWorker:onmessage', event);
    switch (event.data.type) {
        case MESSAGES.INIT:
            init(event.data);
            break;
        case MESSAGES.GET_INFO:
            getInfo(event.data);
            break;
        case MESSAGES.GET_ACCOUNT_INFO:
            getAccountInfo(event.data);
            break;
        case MESSAGES.PUSH_TRANSACTION:
            pushTransaction(event.data);
            break;
    }
};

let api: RippleAPI;

const init = async (data: any) => {
    api = new RippleAPI({
        server: 'wss://s.altnet.rippletest.net'
    });
    try {
        await api.connect();
        postMessage({
            id: data.id,
            type: RESPONSES.INIT,
        });
    } catch (error) {
        handleError(error);
    }
}

const handleError = ({ id, error }: any) => {
    console.warn("HANDLE ERROR!", error)
    postMessage({
        id,
        type: RESPONSES.ERROR,
        error: error.message
    });
}

const getInfo = async (data: any) => {
    try {
        const info = await api.getServerInfo();
        postMessage({
            id: data.id,
            type: RESPONSES.INFO,
            info
        });
    } catch (error) {
        handleError({ id: data.id, error });
    }
}

const getAccountInfo = async (data: any) => {
    try {
        const myAddress = 'rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H';
        const info = await api.getAccountInfo(data.address);
        postMessage({
            id: data.id,
            type: RESPONSES.ACCOUNT_INFO,
            info
        });
    } catch (error) {
        handleError({ id: data.id, error });
    }
}

const pushTransaction = async (data: any) => {
    try {
        //serializedTx:"12000022800000002400000001614000000005f5e1006840000000000186a0732102131facd1eab748d6cddc492f54b04e8c35658894f4add2232ebc5afe7521dbe474463044022059737038e1c0bdca0636d245cc52b056b81cad539f8c42e20041ef254a0c54470220789720d2350fcf5adbc5f8a3fb5b835f7b8b8db321c04847f09c3c023e4fbdd581148fb40e1ffa5d557ce9851a535af94965e0dd09888314af739e1a0858950b00e5900d866d7fcdc36f6af5"
        //signature:"3044022059737038e1c0bdca0636d245cc52b056b81cad539f8c42e20041ef254a0c54470220789720d2350fcf5adbc5f8a3fb5b835f7b8b8db321c04847f09c3c023e4fbdd5"
        // const serialized = '12000022800000002400000003201B00CF0E8C61400000003B9ACA0068400000000000000C7321027682178767ECABCCE4DAAA9993ED4A7700FA4A2E61917280FAE5A95C3B5ABF0674463044022040D8B95D14F34C8725298C637B6722CFC1C1991814FB12A99D1EAC2A35A394C8022032231EE25A45F1A62E0F1C83FA12FBABE2E9ACC2A909FD3296323D8B03620A9D8114AF739E1A0858950B00E5900D866D7FCDC36F6AF583148FB40E1FFA5D557CE9851A535AF94965E0DD0988F9EA7D066D656D6F2032E1EA7C06636C69656E747D08726D2D312E322E34E1F1';
        const serialized = '12000022800000002400000001614000000005f5e1006840000000000186a0732102131facd1eab748d6cddc492f54b04e8c35658894f4add2232ebc5afe7521dbe474463044022059737038e1c0bdca0636d245cc52b056b81cad539f8c42e20041ef254a0c54470220789720d2350fcf5adbc5f8a3fb5b835f7b8b8db321c04847f09c3c023e4fbdd581148fb40e1ffa5d557ce9851a535af94965e0dd09888314af739e1a0858950b00e5900d866d7fcdc36f6af5';
        const signature = '304402202f0046af4147a8646a1c06ef63789698756cffb5e2e380cd2740688b71bd15a302201797d6b55175b6b326257737f331f701f1c9d8271fcc990644ef12d1bf3bdf80';
        const hex1 = Buffer.from(serialized).toString('hex');
        const hex2 = Buffer.from(signature).toString('hex');
        console.warn("HEX", hex1, data.tx);
        const info = await api.submit(hex1);
        postMessage({
            id: data.id,
            type: RESPONSES.INFO,
            info
        });
    } catch (error) {
        handleError({ id: data.id, error });
    }
}

// // Testnet account
// // addr: rGz6kFcejym5ZEWnzUCwPjxcfwEPRUPXXG
// // secret: ss2BKjSc4sMdVXcTHxzjyQS2vyhrQ

// // Trezor account
// // rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H

// api.connect().then(() => {
//     /* begin custom code ------------------------------------ */
//     
  
//     console.log('getting account info for', myAddress);
//     return api.getAccountInfo(myAddress);
  
// }).then(info => {
//     console.log(info);
//     console.log('getAccountInfo done');
  
//     /* end custom code -------------------------------------- */
// }).then(() => {
//     return api.disconnect();
// }).then(() => {
//     console.log('done and disconnected.');
// }).catch(console.error);