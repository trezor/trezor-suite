import { useForm } from 'react-hook-form';

import { act, waitFor } from '@testing-library/react';
import { type BtcSwapComposeTemplate } from 'invity-api';

import { createTestStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import {
    TRADING_EXCHANGE_FROM_ADDRESS,
    type TradingExchangeFormProps,
    type TradingSellFormProps,
    type TradingTradeSellExchangeType,
    deriveBitcoinSwapFromAddresses,
} from '@suite-common/trading';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { getComposeAddressPlaceholder } from 'src/utils/wallet/trading/tradingUtils';

import { useTradingComposeTransaction } from './useTradingComposeTransaction';

const STALE_ADDRESS = 'stale-btc-placeholder';
const BTC_PLACEHOLDER = 'btc-placeholder-address';
const SOL_PLACEHOLDER = 'sol-placeholder-address';
const EXTERNAL_ADDRESS = 'external-address-set-meanwhile';

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    useTranslation: () => ({ translationString: (id: string) => id }),
}));

jest.mock('src/hooks/wallet/form/useCompose', () => ({
    useCompose: () => ({
        isLoading: false,
        composeRequest: jest.fn(),
        composedLevels: undefined,
        onFeeLevelChange: jest.fn(),
        setComposedLevels: jest.fn(),
    }),
}));

jest.mock('src/hooks/wallet/form/useFees', () => ({
    useFees: () => ({ changeFeeLevel: jest.fn(), selectedFee: 'normal' }),
}));

jest.mock('src/utils/wallet/trading/tradingUtils', () => ({
    ...jest.requireActual('src/utils/wallet/trading/tradingUtils'),
    getComposeAddressPlaceholder: jest.fn(),
}));

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    deriveBitcoinSwapFromAddresses: jest.fn(),
}));

const mockGetComposeAddressPlaceholder = getComposeAddressPlaceholder as jest.Mock;
const mockDeriveBitcoinSwapFromAddresses = deriveBitcoinSwapFromAddresses as jest.Mock;

const BTC_ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('btc'), formattedBalance: '2' });
const SOL_ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('sol'), formattedBalance: '0.4' });

const feeData = (blockTime: number) => ({
    blockHeight: 0,
    blockTime,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: -1,
    dustLimit: -1,
    levels: [{ label: 'normal' as const, feePerUnit: '2', blocks: 2 }],
});

const buildDefaults = (): TradingSellFormProps =>
    ({
        outputs: [
            {
                type: 'payment',
                address: STALE_ADDRESS,
                amount: '',
                fiat: '',
                currency: { value: 'usd', label: 'USD' },
                token: null,
                label: '',
            },
        ],
        amountInCrypto: true,
        options: ['broadcast'],
        feePerUnit: '',
        feeLimit: '',
        transactionData: '',
        destinationTag: '',
    }) as unknown as TradingSellFormProps;

type RenderComposeTransactionParams = {
    type?: TradingTradeSellExchangeType;
    btcSwapComposeTemplate?: BtcSwapComposeTemplate;
    defaultValues?: Partial<TradingSellFormProps>;
};

const BTC_SWAP_COMPOSE_TEMPLATE: BtcSwapComposeTemplate = {
    extraOutputs: [{ type: 'opreturn', dataHex: 'aa' }],
};

const renderComposeTransaction = ({
    type = 'sell',
    btcSwapComposeTemplate,
    defaultValues,
}: RenderComposeTransactionParams = {}) => {
    const store = createTestStore({
        extra: undefined,
        preloadedState: {
            wallet: {
                accounts: [BTC_ACCOUNT, SOL_ACCOUNT],
                fees: {
                    btc: { status: 'preloaded', data: feeData(600) },
                    sol: { status: 'preloaded', data: feeData(-1) },
                },
                settings: { addressDisplayType: 'original' },
                trading: btcSwapComposeTemplate
                    ? { info: { config: { btcSwapComposeTemplate } } }
                    : undefined,
            },
            device: { devices: [], selectedDevice: undefined },
        } as any,
    });

    return renderHookWithStoreProvider(
        ({ account }: { account: Account }) => {
            const methods = useForm<TradingSellFormProps | TradingExchangeFormProps>({
                mode: 'onChange',
                defaultValues: { ...buildDefaults(), ...defaultValues },
            });
            const compose = useTradingComposeTransaction({
                type,
                account,
                network: getNetwork(account.symbol),
                methods,
                setShowReserveBanner: jest.fn(),
            });

            return { methods, compose };
        },
        { store, initialProps: { account: BTC_ACCOUNT } },
    );
};

describe('useTradingComposeTransaction', () => {
    beforeEach(() => {
        mockGetComposeAddressPlaceholder.mockImplementation((account: Account) =>
            Promise.resolve(account.symbol === 'sol' ? SOL_PLACEHOLDER : BTC_PLACEHOLDER),
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('refreshes the compose address placeholder when the send account changes', async () => {
        const { result, rerender } = renderComposeTransaction();

        expect(result.current.methods.getValues('outputs.0.address')).toBe(STALE_ADDRESS);

        rerender({ account: SOL_ACCOUNT });

        await waitFor(() =>
            expect(result.current.methods.getValues('outputs.0.address')).toBe(SOL_PLACEHOLDER),
        );
    });

    it('keeps an address set while the placeholder request was in flight', async () => {
        let resolvePlaceholder: (address: string) => void = () => {};
        const pendingPlaceholder = new Promise<string>(resolve => {
            resolvePlaceholder = resolve;
        });
        mockGetComposeAddressPlaceholder.mockReturnValueOnce(pendingPlaceholder);

        const { result, rerender } = renderComposeTransaction();

        rerender({ account: SOL_ACCOUNT });

        act(() => {
            result.current.methods.setValue('outputs.0.address', EXTERNAL_ADDRESS);
        });

        await act(async () => {
            resolvePlaceholder(SOL_PLACEHOLDER);
            await pendingPlaceholder;
        });

        expect(result.current.methods.getValues('outputs.0.address')).toBe(EXTERNAL_ADDRESS);
    });

    it('does not derive bitcoin swap fromAddress before the compose template is loaded', async () => {
        mockDeriveBitcoinSwapFromAddresses.mockResolvedValue({
            addresses: ['from-addr'],
            amount: '1000',
        });

        renderComposeTransaction({
            type: 'exchange',
            defaultValues: { setMaxOutputId: 0 },
        });

        await act(() => Promise.resolve());

        expect(mockDeriveBitcoinSwapFromAddresses).not.toHaveBeenCalled();
    });

    it('derives bitcoin swap fromAddress once the compose template is available', async () => {
        mockDeriveBitcoinSwapFromAddresses.mockResolvedValue({
            addresses: ['from-addr'],
            amount: '1000',
        });

        const { result } = renderComposeTransaction({
            type: 'exchange',
            btcSwapComposeTemplate: BTC_SWAP_COMPOSE_TEMPLATE,
            defaultValues: { setMaxOutputId: 0 },
        });

        await waitFor(() => expect(mockDeriveBitcoinSwapFromAddresses).toHaveBeenCalledTimes(1));
        await waitFor(() =>
            expect(result.current.methods.getValues(TRADING_EXCHANGE_FROM_ADDRESS)).toBe(
                'from-addr',
            ),
        );
        expect(mockDeriveBitcoinSwapFromAddresses).toHaveBeenCalledWith(
            expect.objectContaining({
                btcSwapComposeTemplate: BTC_SWAP_COMPOSE_TEMPLATE,
            }),
        );
    });
});
