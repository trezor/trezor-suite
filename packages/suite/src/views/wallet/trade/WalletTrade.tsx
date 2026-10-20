import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectFullSelectedAccount } from '@suite/account';
import { selectIsDebugModeActive } from '@suite/debug';
import {
    type TradingType,
    getTradingPrefilledFromAccountData,
    tradingActions,
} from '@suite-common/trading';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { WalletLayout } from 'src/components/wallet';
import { TradingFormEmbed } from 'src/views/wallet/trading/common/TradingFormEmbed/TradingFormEmbed';

// Debug only: account page previewing TradingFormEmbed, revert together with the wallet-trade route
export const WalletTrade = () => {
    const { dispatch } = useServices(injectDispatch);
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const [type, setType] = useState<TradingType>('exchange');
    const account = selectedAccount.status === 'loaded' ? selectedAccount.account : undefined;

    useEffect(() => {
        if (!isDebugModeActive || !account) {
            return;
        }

        dispatch(
            tradingActions.setTradingFromPrefilledAccount(
                getTradingPrefilledFromAccountData(account),
            ),
        );
    }, [account, dispatch, isDebugModeActive]);

    if (!isDebugModeActive || !account) {
        return <WalletLayout title="TR_NAV_TRADE" account={selectedAccount} />;
    }

    return (
        <WalletLayout title="TR_NAV_TRADE" account={selectedAccount}>
            <TradingFormEmbed type={type} account={account} onTypeChange={setType} />
        </WalletLayout>
    );
};
