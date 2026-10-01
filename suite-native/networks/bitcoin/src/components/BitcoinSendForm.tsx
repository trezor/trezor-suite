import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { VStack } from '@suite-native/atoms';
import {
    SendFormAddressInput,
    withSendFormLayout,
} from '@suite-native/network-module-suite-native-sendform-lego-bricks';

import { bitcoinActions, selectBitcoinSendFormAddress } from '../bitcoinSlice';
import { BitcoinFeeSelection } from './BitcoinFeeSelection';

const BitcoinSendFormFields = () => {
    const address = useSelector(selectBitcoinSendFormAddress);
    const { dispatch } = useServices(injectDispatch);

    const handleAddressChange = (value: string) => {
        dispatch(bitcoinActions.setSendFormAddress(value));
    };

    return (
        <VStack spacing={24}>
            <SendFormAddressInput value={address} onChangeText={handleAddressChange} />
            <BitcoinFeeSelection />
        </VStack>
    );
};

export const BitcoinSendForm = withSendFormLayout(BitcoinSendFormFields, {
    title: 'Send Bitcoin',
});
