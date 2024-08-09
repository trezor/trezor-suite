import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';

import { SendStackParamList, SendStackRoutes, StackProps } from '@suite-native/navigation';
import {
    AccountsRootState,
    selectAccountNetworkSymbol,
    updateFeeInfoThunk,
} from '@suite-common/wallet-core';

import { SendOutputsForm } from '../components/SendOutputsForm';
import { SendFormScreenWrapper } from '../components/SendFormScreenWrapper';

export const SendOutputsScreen = ({
    route: { params },
}: StackProps<SendStackParamList, SendStackRoutes.SendOutputs>) => {
    const { accountKey } = params;
    const dispatch = useDispatch();

    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    // TODO: Fetch periodically. So if the user stays on the screen for a long time, the fee info is updated in the background.
    useEffect(() => {
        if (networkSymbol) dispatch(updateFeeInfoThunk(networkSymbol));
    }, [networkSymbol, dispatch]);

    return (
        <SendFormScreenWrapper accountKey={accountKey}>
            <SendOutputsForm accountKey={accountKey} />
        </SendFormScreenWrapper>
    );
};
