import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { VStack } from '@suite-native/atoms';
import {
    SendFormAddressInput,
    withSendFormLayout,
} from '@suite-native/network-module-suite-native-sendform-lego-bricks';

import { selectSolanaSendFormAddress, solanaActions } from '../solanaSlice';
import { SolanaFeeSelection } from './SolanaFeeSelection';

const SolanaSendFormFields = () => {
    const address = useSelector(selectSolanaSendFormAddress);
    const { dispatch } = useServices(injectDispatch);

    const handleAddressChange = (value: string) => {
        dispatch(solanaActions.setSendFormAddress(value));
    };

    return (
        <VStack spacing={24}>
            <SendFormAddressInput value={address} onChangeText={handleAddressChange} />
            <SolanaFeeSelection />
        </VStack>
    );
};

export const SolanaSendForm = withSendFormLayout(SolanaSendFormFields, {
    title: 'Send Solana',
});
