import TrezorConnect from '@trezor/connect';
import { NostrClient } from '@trezor/connect-nostr';

import { Dispatch, GetState } from 'src/types/suite';
import { NOSTR } from 'src/actions/suite/constants';

export type NostrAction =
    | { type: typeof NOSTR.DISPOSE }
    | { type: typeof NOSTR.NEW_EVENT; payload: { event: any } }
    | {
          type: typeof NOSTR.SET_STATUS;
          payload: {
              status: 'connected' | 'disconnected';
              npub: NostrClient['npubStr'];
              nsec: NostrClient['nsecStr'];
              relayUrl: string;
              type: 'hot-keys' | 'signer';
          };
      };

const nostrClient = new NostrClient({
    type: 'hot-keys',
    nsecStr: 'nsec12rfalrsa6dvnxjhhf4n0d2k4rc2wc8hy49qvp34k2hj8p7cppnnq8ysujz',
    relayUrl: 'wss://relay.primal.net',
});

export const init = () => (dispatch: Dispatch, _getState: GetState) => {
    nostrClient.on('event', message => {
        const { content } = message;
        dispatch({
            type: NOSTR.NEW_EVENT,
            payload: {
                event: {
                    ...message,
                    // todo: content parsing should take place deeper
                    content: JSON.parse(content),
                },
            },
        });
    });

    nostrClient.on('status', event => {
        console.log('event status', event);
        dispatch({
            type: NOSTR.SET_STATUS,
            payload: {
                status: event.relayConnection,
                type: event.identity.type,
                npub: event.identity.npubStr,
                nsec: event.identity.nsecStr,
                relayUrl: nostrClient.relay.url,
            },
        });
    });

    nostrClient.connect();
};

export const connect = () => async (_dispatch: Dispatch, _getState: GetState) => {
    return nostrClient.connect();
};

export const subscribe = () => async (_dispatch: Dispatch, getState: GetState) => {
    const { npub } = getState().nostr;
    const { selectedDevice } = getState().device;

    if (!selectedDevice) {
        console.warn('no device connected');
        return;
    }

    const response = await TrezorConnect.nostrGetPublicKey({
        path: "m/44'/1237'/0'/0/0",
        device: selectedDevice,
        useEmptyPassphrase: selectedDevice?.useEmptyPassphrase,
    });

    if (!response.success) {
        console.log('nostrGetPublicKey error', response.payload.error);
        return;
    }

    const permanentNpub = response.payload.pubkey;
    nostrClient?.subscribe({ recipientPubkeys: [npub, permanentNpub] });
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

export const setIdentity = () => async (_dispatch: Dispatch, _getState: GetState) => {
    const { selectedDevice } = _getState().device;

    if (!selectedDevice) {
        console.warn('no device connected');
        return;
    }

    const targetType: NostrClient['type'] =
        nostrClient?.type === 'hot-keys' ? 'signer' : 'hot-keys';

    console.log('targetType', targetType);

    if (targetType === 'signer') {
        const response = await TrezorConnect.nostrGetPublicKey({
            path: "m/44'/1237'/0'/0/0",
            device: selectedDevice,
            useEmptyPassphrase: selectedDevice?.useEmptyPassphrase,
        });

        console.log('response', response);
        if (!response.success) {
            return;
        }

        nostrClient?.setIdentity({
            type: 'signer',
            // @ts-ignore. will this change in the fw?
            npubStr: response.payload.pubkey,
            signer: (event: any) =>
                TrezorConnect.nostrSignEvent({
                    path: "m/44'/1237'/0'/0/0",
                    device: selectedDevice,
                    useEmptyPassphrase: selectedDevice?.useEmptyPassphrase,
                    ...event,
                }),
        });
    } else {
        nostrClient?.setIdentity({
            type: 'hot-keys',
            nsecStr: nostrClient.getNewNsec(),
        });
    }

    console.log('nostrClient', nostrClient);
};
