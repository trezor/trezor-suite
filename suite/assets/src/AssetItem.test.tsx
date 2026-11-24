import { type FormEventHandler } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createAssetId } from '@suite-common/asset-types';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { mock } from '@trezor/dependency-injection';
import { BigNumber } from '@trezor/utils';

import { AssetItem, type AssetItemProps } from './AssetItem';
import {
    MockAssetItemEnvironment,
    mockAssetItemContract,
    mockAssetItemRecognizedUrlContract,
    mockAssetItemSuspiciousContract,
} from '../mocks/mockAssetItemEnvironment';

const btcId = createAssetId({ networkSymbol: asNetworkSymbol('btc') });
const onClick = mock<AssetItemProps['onClick']>();

describe('AssetItem', () => {
    beforeEach(() => onClick.mockClear());

    it('keeps recognized catalogue names readable and masks URLs in unrecognized names', () => {
        render(
            <MockAssetItemEnvironment>
                <AssetItem
                    assetId={createAssetId({
                        networkSymbol: asNetworkSymbol('eth'),
                        contractAddress: mockAssetItemRecognizedUrlContract,
                    })}
                    onClick={onClick}
                />
                <AssetItem
                    assetId={createAssetId({
                        networkSymbol: asNetworkSymbol('eth'),
                        contractAddress: mockAssetItemSuspiciousContract,
                    })}
                    onClick={onClick}
                />
            </MockAssetItemEnvironment>,
        );

        expect(getComputedStyle(screen.getByText(/https:\/\/scam\.com\/claim/i)).filter).toMatch(
            /^blur\(/,
        );
        expect(getComputedStyle(screen.getByText(/https:\/\/trezor\.io/i)).filter).not.toMatch(
            /^blur\(/,
        );
    });

    it('formats a token amount using metadata resolved from its normalized identity', () => {
        render(
            <MockAssetItemEnvironment>
                <AssetItem
                    assetId={createAssetId({
                        networkSymbol: asNetworkSymbol('eth'),
                        contractAddress: mockAssetItemContract,
                    })}
                    balance={{ cryptoAmount: '1234.56789', fiatAmount: null }}
                    onClick={onClick}
                />
            </MockAssetItemEnvironment>,
        );

        expect(screen.getByRole('button').textContent).toMatch(/1,234\.56\sUSDC/);
    });

    it.each([
        ['bsc', 'BNB'],
        ['base', 'Ethereum'],
    ])(
        'renders the native asset name of %s separately from the network name',
        (network, ticker) => {
            render(
                <MockAssetItemEnvironment>
                    <AssetItem
                        assetId={createAssetId({ networkSymbol: asNetworkSymbol(network) })}
                        onClick={onClick}
                    />
                </MockAssetItemEnvironment>,
            );

            expect(screen.getByText(ticker)).toBeTruthy();
        },
    );

    it('formats fiat in the selected currency and locale', () => {
        render(
            <MockAssetItemEnvironment locale="de" fiatCurrency="eur">
                <AssetItem
                    assetId={btcId}
                    balance={{
                        cryptoAmount: '1',
                        fiatAmount: asBaseCurrencyAmount(new BigNumber('1234.56')),
                    }}
                    onClick={onClick}
                />
            </MockAssetItemEnvironment>,
        );

        expect(screen.getByRole('button').textContent).toMatch(/1\.234,56\s€/);
    });

    it('shows the asset name then network without a text badge', () => {
        const { container } = render(
            <MockAssetItemEnvironment>
                <AssetItem
                    assetId={createAssetId({
                        networkSymbol: asNetworkSymbol('eth'),
                        contractAddress: mockAssetItemContract,
                    })}
                    onClick={onClick}
                />
            </MockAssetItemEnvironment>,
        );

        expect(screen.getByRole('button').textContent).toBe('USD CoinEthereum');
        expect(container.querySelector('[data-component="Badge"]')).toBeNull();
    });

    it('formats raw balance amounts and updates when the balance changes or is removed', () => {
        const { rerender } = render(
            <MockAssetItemEnvironment>
                <AssetItem
                    assetId={btcId}
                    balance={{
                        cryptoAmount: '1',
                        fiatAmount: asBaseCurrencyAmount(new BigNumber(1234.56)),
                    }}
                    onClick={onClick}
                />
            </MockAssetItemEnvironment>,
        );

        expect(screen.getByText('$1,234.56')).toBeTruthy();
        expect(screen.getByRole('button').textContent).toMatch(/1\.00\sBTC/);

        rerender(
            <MockAssetItemEnvironment>
                <AssetItem
                    assetId={btcId}
                    balance={{
                        cryptoAmount: '0',
                        fiatAmount: asBaseCurrencyAmount(new BigNumber(0)),
                    }}
                    onClick={onClick}
                />
            </MockAssetItemEnvironment>,
        );

        expect(screen.getByText('$0.00')).toBeTruthy();
        expect(screen.getByRole('button').textContent).toMatch(/0\sBTC/);

        rerender(
            <MockAssetItemEnvironment>
                <AssetItem assetId={btcId} onClick={onClick} />
            </MockAssetItemEnvironment>,
        );

        expect(screen.getByRole('button').textContent).toBe('BitcoinBitcoin');
    });

    it('keeps crypto visible when fiat pricing is unavailable', () => {
        render(
            <MockAssetItemEnvironment>
                <AssetItem
                    assetId={btcId}
                    balance={{ cryptoAmount: '1', fiatAmount: null }}
                    onClick={onClick}
                />
            </MockAssetItemEnvironment>,
        );

        expect(screen.getByRole('button').textContent).toMatch(/1\.00\sBTC/);
        expect(screen.getByRole('button').textContent).not.toContain('$');
    });

    it('respects the satoshi preference without treating input as subunits', () => {
        render(
            <MockAssetItemEnvironment useSats>
                <AssetItem
                    assetId={btcId}
                    balance={{ cryptoAmount: '0.000001', fiatAmount: null }}
                    onClick={onClick}
                />
            </MockAssetItemEnvironment>,
        );

        expect(screen.getByRole('button').textContent).toMatch(/100\ssat/);
    });

    it('redacts both amounts in discreet mode', () => {
        render(
            <MockAssetItemEnvironment isDiscreet>
                <AssetItem
                    assetId={btcId}
                    balance={{
                        cryptoAmount: '12.34',
                        fiatAmount: asBaseCurrencyAmount(new BigNumber(5678.9)),
                    }}
                    onClick={onClick}
                />
            </MockAssetItemEnvironment>,
        );

        expect(screen.getByRole('button').textContent).not.toContain('12.34');
        expect(screen.getByRole('button').textContent).not.toContain('5,678.90');
        expect(screen.getByRole('button').textContent).toContain('###');
    });

    it('activates with the asset identity using the keyboard', async () => {
        const user = userEvent.setup();
        render(
            <MockAssetItemEnvironment>
                <AssetItem assetId={btcId} onClick={onClick} />
            </MockAssetItemEnvironment>,
        );

        await user.tab();
        await user.keyboard('{Enter}');

        expect(onClick).toHaveBeenCalledWith(btcId);
    });

    it('never submits a surrounding form or activates a disabled row', async () => {
        const user = userEvent.setup();
        const onSubmit = mock<FormEventHandler<HTMLFormElement>>(event => event.preventDefault());
        render(
            <MockAssetItemEnvironment>
                <form onSubmit={onSubmit}>
                    <AssetItem assetId={btcId} onClick={onClick} data-testid="enabled" />
                    <AssetItem
                        assetId={btcId}
                        onClick={onClick}
                        isDisabled
                        data-testid="disabled"
                    />
                </form>
            </MockAssetItemEnvironment>,
        );

        await user.click(screen.getByTestId('disabled'));
        expect(screen.getByTestId('disabled')).toHaveProperty('disabled', true);
        expect(onClick).not.toHaveBeenCalled();
        await user.click(screen.getByTestId('enabled'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onSubmit).not.toHaveBeenCalled();
    });
});
