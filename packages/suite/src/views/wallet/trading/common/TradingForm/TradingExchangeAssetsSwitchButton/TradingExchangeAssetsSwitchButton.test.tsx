import '@suite-common/test-utils/globalOverrides';

import { useForm } from 'react-hook-form';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type Coins, type CryptoId, type Platforms } from 'invity-api';

import { mockNetworkIcon, mockNetworksState } from '@suite-common/networks/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import {
    type TradingAssetOption,
    type TradingAssetSellOption,
    type TradingExchangeFormProps,
    initialState as tradingInitialState,
} from '@suite-common/trading';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

import {
    BTC_ACCOUNT,
    XRP_ACCOUNT,
} from 'src/actions/wallet/trading/__fixtures__/tradingCommonActions/accounts';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';
import { type TradingFormContextValues } from 'src/types/trading/tradingForm';

import { TradingExchangeAssetsSwitchButton } from './TradingExchangeAssetsSwitchButton';
import { mockInitialAppState } from '../../../../../../../mocks/mockInitialAppState';

const BTC_SYMBOL = asNetworkSymbol('btc');
const ETH_SYMBOL = asNetworkSymbol('eth');
const XRP_SYMBOL = asNetworkSymbol('xrp');

const BITCOIN_CRYPTO_ID = 'bitcoin' as CryptoId;
const ETHEREUM_CRYPTO_ID = 'ethereum' as CryptoId;
const RIPPLE_CRYPTO_ID = 'ripple' as CryptoId;

const BITCOIN_SELL_ASSET: TradingAssetSellOption = {
    id: BITCOIN_CRYPTO_ID,
    isNativeToken: true,
    name: 'Bitcoin',
    coingeckoId: 'bitcoin',
    contractAddress: null,
    symbol: BTC_SYMBOL,
    displaySymbol: 'BTC',
    networkName: 'Bitcoin',
    networkSymbol: BTC_SYMBOL,
    accountKey: BTC_ACCOUNT.key,
};

const XRP_ASSET: TradingAssetOption = {
    id: RIPPLE_CRYPTO_ID,
    isNativeToken: true,
    name: 'XRP',
    coingeckoId: 'ripple',
    contractAddress: null,
    symbol: XRP_SYMBOL,
    displaySymbol: 'XRP',
    networkName: 'XRP',
    networkSymbol: XRP_SYMBOL,
};

const coins = {
    [BITCOIN_CRYPTO_ID]: { symbol: 'btc', name: 'Bitcoin', coingeckoId: 'bitcoin' },
    [ETHEREUM_CRYPTO_ID]: { symbol: 'eth', name: 'Ethereum', coingeckoId: 'ethereum' },
    [RIPPLE_CRYPTO_ID]: { symbol: 'xrp', name: 'XRP', coingeckoId: 'ripple' },
} as Coins;

const QUOTED_XRP_AMOUNT = '365.32229899';

type SwitchButtonHarnessProps = {
    receiveAccount: Account | undefined;
    onSwitch: jest.Mock;
};

const SwitchButtonHarness = ({ receiveAccount, onSwitch }: SwitchButtonHarnessProps) => {
    const methods = useForm<TradingExchangeFormProps>({
        defaultValues: { sendCryptoSelect: BITCOIN_SELL_ASSET, receiveCryptoSelect: XRP_ASSET },
    });
    const contextValue = {
        ...methods,
        type: 'exchange',
        shouldSendInSats: false,
        tradingReceiveAddress: { selectedAccount: receiveAccount },
    } as unknown as TradingFormContextValues<'exchange'>;

    return (
        <TradingFormContext.Provider value={contextValue}>
            <TradingExchangeAssetsSwitchButton
                receiveAmount={QUOTED_XRP_AMOUNT}
                onSwitch={onSwitch}
            />
        </TradingFormContext.Provider>
    );
};

type RenderSwitchButtonParams = {
    receiveAccount?: Account;
    enabledNetworks?: NetworkSymbol[];
    sellCryptoIds?: CryptoId[];
};

const renderSwitchButton = ({
    receiveAccount,
    enabledNetworks = [BTC_SYMBOL, ETH_SYMBOL, XRP_SYMBOL],
    sellCryptoIds = [BITCOIN_CRYPTO_ID, ETHEREUM_CRYPTO_ID, RIPPLE_CRYPTO_ID],
}: RenderSwitchButtonParams = {}) => {
    const onSwitch = jest.fn();
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: {
            ...mockInitialAppState,
            networks: mockNetworksState([BTC_SYMBOL, ETH_SYMBOL, XRP_SYMBOL]),
            wallet: {
                ...mockInitialAppState.wallet,
                accounts: [BTC_ACCOUNT, XRP_ACCOUNT],
                settings: { ...mockInitialAppState.wallet.settings, enabledNetworks },
                trading: {
                    ...tradingInitialState,
                    info: { coins, platforms: {} as Platforms },
                    exchange: {
                        ...tradingInitialState.exchange,
                        exchangeInfo: {
                            providerInfos: {},
                            buyCryptoIds: [BITCOIN_CRYPTO_ID, ETHEREUM_CRYPTO_ID, RIPPLE_CRYPTO_ID],
                            sellCryptoIds,
                        },
                    },
                },
            },
        } satisfies AppState,
    });

    renderWithProviders(
        { ...services, networks: { networkIcon: mockNetworkIcon() } },
        <SwitchButtonHarness receiveAccount={receiveAccount} onSwitch={onSwitch} />,
    );

    return { onSwitch, button: screen.getByTestId('@trading/form/switch-assets') };
};

describe('TradingExchangeAssetsSwitchButton', () => {
    it('switches to the receive account with the quoted amount cut to the asset decimals', async () => {
        const { onSwitch, button } = renderSwitchButton({ receiveAccount: XRP_ACCOUNT });

        await userEvent.click(button);

        expect(onSwitch).toHaveBeenCalledWith({
            receiveAccountKey: XRP_ACCOUNT.key,
            payAmount: '365.322298',
        });
    });

    it('is disabled without a receive account on an enabled network', async () => {
        const { onSwitch, button } = renderSwitchButton();

        expect(button).toBeDisabled();
        await userEvent.click(button);
        expect(onSwitch).not.toHaveBeenCalled();
    });

    it('is disabled when the receive asset cannot be paid with', () => {
        const { button } = renderSwitchButton({
            receiveAccount: XRP_ACCOUNT,
            sellCryptoIds: [BITCOIN_CRYPTO_ID, ETHEREUM_CRYPTO_ID],
        });

        expect(button).toBeDisabled();
    });

    it('leaves the pay side empty and explains the inactive network', async () => {
        const { onSwitch, button } = renderSwitchButton({
            enabledNetworks: [BTC_SYMBOL, ETH_SYMBOL],
        });

        await userEvent.click(button);

        expect(onSwitch).toHaveBeenCalledWith({});
        const modal = screen.getByTestId('@trading/form/switch-assets-modal');
        expect(modal).toHaveTextContent(/XRP/);

        await userEvent.click(screen.getByTestId('@trading/form/switch-assets-modal/confirm'));

        expect(screen.queryByTestId('@trading/form/switch-assets-modal')).toBeNull();
    });
});
