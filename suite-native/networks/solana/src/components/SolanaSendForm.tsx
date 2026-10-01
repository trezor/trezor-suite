import { useState } from 'react';

import { VStack } from '@suite-native/atoms';
import {
    SendFormAddressInput,
    withSendFormLayout,
} from '@suite-native/network-module-suite-native-sendform-lego-bricks';

import { SolanaFeeSelection } from './SolanaFeeSelection';

const SolanaSendFormFields = () => {
    const [address, setAddress] = useState('');

    return (
        <VStack spacing={24}>
            <SendFormAddressInput value={address} onChangeText={setAddress} />
            <SolanaFeeSelection />
        </VStack>
    );
};

export const SolanaSendForm = withSendFormLayout(SolanaSendFormFields, {
    title: 'Send Solana',
});
