import { useSelector } from 'react-redux';

import { useDispatch } from '@suite-common/redux-utils';
import { cryptoIdToNetworkSymbol, tradingExchangeActions } from '@suite-common/trading';
import { type AccountsRootState, selectAccounts } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { Button, Text } from '@suite-native/atoms';
import { exchangeActions } from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';

const USDC_ETH: TradeableAsset = {
    symbol: 'USDC',
    name: 'USDC',
    coingeckoId: 'usd-coin',
    cryptoId: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TradeableAsset['cryptoId'],
    networkId: 'ethereum',
    contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress,
};

const USDT_ETH: TradeableAsset = {
    symbol: 'USDT',
    name: 'Tether USDT',
    coingeckoId: 'tether',
    cryptoId: 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7' as TradeableAsset['cryptoId'],
    networkId: 'ethereum',
    contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7' as TokenAddress,
};

const ButtonStyleOverride = prepareNativeStyle(({ spacings }) => ({
    paddingHorizontal: spacings.sp4,
    paddingVertical: spacings.sp2,
}));

export const ExchangeUsdcPresetButton = () => {
    const { applyStyle } = useNativeStyles();
    const { getValues, setValue } = useExchangeFormContext();
    const dispatch = useDispatch();
    const debugAccount = useSelector((state: AccountsRootState) =>
        selectAccounts(state).find(
            ({ symbol, tokens }) =>
                symbol === 'eth' &&
                tokens?.some(token => token.symbol === 'USDC' && Number(token.balance) >= 1),
        ),
    );

    if (!debugAccount) {
        return (
            <Text variant="body-xs" color="contentCritical">
                No account with USDC found.
            </Text>
        );
    }

    const handlePress = () => {
        const previousReceiveSymbol = cryptoIdToNetworkSymbol(getValues('receiveAsset')?.cryptoId);
        const receiveSymbol = cryptoIdToNetworkSymbol(USDT_ETH.cryptoId);

        setValue('sendAsset', USDC_ETH);
        setValue('sendAccount', debugAccount);
        dispatch(tradingExchangeActions.setTradingAccountKey(debugAccount.key));
        setValue('sendCryptoAmount', '1');
        setValue('receiveAsset', USDT_ETH);
        dispatch(exchangeActions.sendAssetChanged());
        dispatch(
            previousReceiveSymbol === receiveSymbol
                ? exchangeActions.receiveTokenChanged()
                : exchangeActions.receiveAssetChanged(),
        );
    };

    return (
        <Button
            size="medium"
            onPress={handlePress}
            intent="accentViolet"
            style={applyStyle(ButtonStyleOverride)}
        >
            Prefill 1 USDC→USDT
        </Button>
    );
};
