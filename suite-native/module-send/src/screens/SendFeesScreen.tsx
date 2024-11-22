import { useSelector } from 'react-redux';
import { useEffect } from 'react';

import { SendStackParamList, SendStackRoutes, StackProps } from '@suite-native/navigation';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

import { SendFeesForm } from '../components/SendFeesForm';
import { SendScreen } from '../components/SendScreen';
import { AccountBalanceScreenHeader } from '../components/SendScreenSubHeader';

export const SendFeesScreen = ({
    route: { params },
}: StackProps<SendStackParamList, SendStackRoutes.SendFees>) => {
    const { accountKey, tokenContract } = params;

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    useEffect(() => {
        // Subscribe to blocks for Solana, since they are not fetched globally
        // this is needed for correct Solana fee estimation
        if (account && account.networkType === 'solana') {
            TrezorConnect.blockchainSubscribe({
                coin: account.symbol,
                blocks: true,
            });

            return () => {
                TrezorConnect.blockchainUnsubscribe({
                    coin: account.symbol,
                    blocks: true,
                });
            };
        }
    }, [account]);

    if (!account) return;

    return (
        <SendScreen
            screenHeader={
                <AccountBalanceScreenHeader accountKey={accountKey} tokenContract={tokenContract} />
            }
        >
            <SendFeesForm accountKey={accountKey} tokenContract={tokenContract} />
        </SendScreen>
    );
};
