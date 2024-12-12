import TrezorConnect from '@trezor/connect';
import { NostrClient } from '@trezor/connect-nostr';

import { Dispatch, GetState } from 'src/types/suite';
import { NOSTR } from 'src/actions/suite/constants';

export type NostrAction =
    | {
          type: typeof NOSTR.INIT;
          payload: { npub: string; nsec: string; relayUrl: string; type: 'hot-keys' | 'signer' };
      }
    | { type: typeof NOSTR.DISPOSE }
    | { type: typeof NOSTR.NEW_EVENT; payload: { event: any } }
    | {
          type: typeof NOSTR.SET_STATUS;
          payload: {
              status: 'connected' | 'disconnected' | 'connecting';
          };
      };

const nostrClient = new NostrClient({
    type: 'hot-keys',
    nsecStr: 'nsec12rfalrsa6dvnxjhhf4n0d2k4rc2wc8hy49qvp34k2hj8p7cppnnq8ysujz',
    relayUrl: 'wss://relay.primal.net',
});

export const init = () => (dispatch: Dispatch, _getState: GetState) => {
    // nostrClient.newIdentity();

    dispatch({
        type: NOSTR.INIT,
        payload: {
            npub: nostrClient.npub,
            nsec: nostrClient.nsecStr,
            relayUrl: nostrClient.relay.url,
        },
    });

    nostrClient.on('event', message => {
        console.log('nostr event', message);

        if (message) {
            const { content } = message;
            dispatch({
                type: NOSTR.NEW_EVENT,
                payload: {
                    event: {
                        ...message,
                        content: JSON.parse(content),
                    },
                },
            });
        }
    });

    nostrClient.on('status', status => {
        dispatch({
            type: NOSTR.SET_STATUS,
            payload: {
                status,
            },
        });
    });

    nostrClient.on('identity', identity => {
        dispatch({
            type: NOSTR.INIT,
            payload: {
                type: identity.type,
                npub: identity.npub,
                nsec: identity.nsec,
                relayUrl: nostrClient.relay.url,
            },
        });
    });

    nostrClient.connect();
};

export const subscribe = () => (_dispatch: Dispatch, getState: GetState) => {
    const { npub } = getState().nostr.keys;
    nostrClient?.subscribe({ recipientPubkey: npub });
};

export const send = (content: any) => (_dispatch: Dispatch, _getState: GetState) => {
    nostrClient?.send(content);
};

export const request =
    (params: { kind: number; content: string; tags: any[] }) =>
    (_dispatch: Dispatch, _getState: GetState) => {
        return nostrClient?.request(params);
    };

export const newIdentity = () => (_dispatch: Dispatch, _getState: GetState) => {
    return nostrClient?.newIdentity();
};

export const dispose = () => (_dispatch: Dispatch, _getState: GetState) => {
    return nostrClient?.dispose();
};

export const setIdentity = () => async (dispatch: Dispatch, _getState: GetState) => {
    const { selectedDevice } = _getState().device;

    const response = await TrezorConnect.nostrGetPublicKey({
        path: "m/44'/1237'/0'/0/0",
        device: selectedDevice,
    });

    console.log('response', response);
    if (!response.success) {
        return;
    }

    nostrClient?.setIdentity({
        type: 'signer',
        npubStr: response.payload.pubkey,
        signer: (event: any) =>
            TrezorConnect.nostrSignEvent({
                path: "m/44'/1237'/0'/0/0",
                device: selectedDevice,
                ...event,
            }),
    });

    console.log('nostrClient', nostrClient);
};
