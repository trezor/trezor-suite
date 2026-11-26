import { useEffect } from 'react';

import { Translation } from '@suite/intl';
import {
    TradingTokenMetadataProvider,
    getCryptoId,
    toTokenCryptoId,
    tradingActions,
    tradingExchangeActions,
} from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { Banner } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { getLidoDeployment } from '@trezor/network-ethereum-suite-common';
import { injectDispatch } from '@trezor/redux-utils';

import { TradingFormEmbed } from '#src/views/wallet/trading/common/TradingFormEmbed/TradingFormEmbed';

type LidoUnstakeSwapProps = {
    account: Account;
};

/** The instant exit: the trading swap form, offering the account's wstETH for sale. */
export const LidoUnstakeSwap = ({ account }: LidoUnstakeSwapProps) => {
    const { dispatch } = useServices(injectDispatch);
    const deployment = getLidoDeployment(account.symbol);
    const wstETHContract = deployment?.wstETH;
    const { key: accountKey, symbol: networkSymbol } = account;

    useEffect(() => {
        if (wstETHContract === undefined) {
            return;
        }

        // The swap is from the account's wstETH to the coin it was staked from, back into the same
        // account, so a form left over from another swap must not decide either side.
        dispatch(tradingExchangeActions.clearQuotesAndParams());
        dispatch(
            tradingActions.setTradingFromPrefilledAccount({
                key: accountKey,
                cryptoId: toTokenCryptoId(networkSymbol, wstETHContract),
                receiveCryptoId: getCryptoId(networkSymbol),
            }),
        );
        dispatch(tradingExchangeActions.setReceiveAccountKey(accountKey));
    }, [accountKey, dispatch, networkSymbol, wstETHContract]);

    if (deployment === null) {
        return (
            <Banner intent="warning" description={<Translation id="TR_EARN_LIDO_UNAVAILABLE" />} />
        );
    }

    return (
        <TradingTokenMetadataProvider>
            <TradingFormEmbed type="exchange" account={account} />
        </TradingTokenMetadataProvider>
    );
};
