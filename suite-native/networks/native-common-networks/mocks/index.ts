import { solanaInitialState } from '@suite-native/network-solana/mocks';

import { sendFormInitialState } from '../src/sendFormSlice';

export const nativeNetworksInitialState = {
    sendForm: sendFormInitialState,
    solana: solanaInitialState,
};
