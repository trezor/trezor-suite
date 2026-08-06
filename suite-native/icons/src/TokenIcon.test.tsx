import React from 'react';

import { asNetworkSymbol, getCoingeckoId } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { getAssetLogoContractAddresses } from '@suite-common/wallet-utils';
import { act, fireEvent, renderWithBasicProvider, waitFor } from '@suite-native/test-utils';
import { getAssetLogoUrl } from '@trezor/asset-utils';
import { createDeferred } from '@trezor/utils';

import { TokenIcon } from './TokenIcon';

jest.mock('@suite-common/wallet-utils', () => ({
    ...jest.requireActual('@suite-common/wallet-utils'),
    getAssetLogoContractAddresses: jest.fn(),
}));

const tokenIconHint = 'Token Icon';
const networkIconHint = 'Network Icon';

const contractA = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const contractB = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');
const opSymbol = asNetworkSymbol('op');

const getTokenIconUrl = (contractAddress: string, size = 32) =>
    getAssetLogoUrl({
        coingeckoId: getCoingeckoId(ethSymbol)!,
        contractAddress,
        density: 2,
        size,
    });

describe('TokenIcon', () => {
    const renderTokenIcon = (props: React.ComponentProps<typeof TokenIcon>) =>
        renderWithBasicProvider(<TokenIcon {...props} />);

    it('shows a placeholder immediately and the correct icon after resolving when a recycled instance receives new props', async () => {
        const fresh = renderTokenIcon({ symbol: ethSymbol });
        await act(async () => {});
        const ethSource = fresh.getByHintText(tokenIconHint).props.source;
        fresh.unmount();

        const { getByHintText, queryByHintText, rerender } = renderTokenIcon({
            symbol: btcSymbol,
        });
        await act(async () => {});

        // simulates FlashList cell recycling: same mounted instance, new asset props
        rerender(<TokenIcon symbol={ethSymbol} />);

        expect(queryByHintText(tokenIconHint)).toBeNull();

        await act(async () => {});
        expect(getByHintText(tokenIconHint).props.source).toEqual(ethSource);
    });

    it('ignores a stale async url resolution that arrives after the instance was recycled', async () => {
        const deferredA = createDeferred<string[]>();
        (getAssetLogoContractAddresses as jest.Mock).mockImplementation(
            (_symbol: string, contract: string) =>
                contract === contractA ? deferredA.promise : Promise.resolve([contract]),
        );

        const { getByHintText, rerender } = renderTokenIcon({
            symbol: ethSymbol,
            contractAddress: contractA,
        });

        rerender(<TokenIcon symbol={ethSymbol} contractAddress={contractB} />);

        await waitFor(() => {
            expect(JSON.stringify(getByHintText(tokenIconHint).props.source)).toContain(
                getTokenIconUrl(contractB),
            );
        });

        deferredA.resolve([contractA]);
        await act(async () => {});

        expect(JSON.stringify(getByHintText(tokenIconHint).props.source)).toContain(
            getTokenIconUrl(contractB),
        );
    });

    it('shows a text placeholder when the url resolution rejects', async () => {
        (getAssetLogoContractAddresses as jest.Mock).mockRejectedValue(new Error('failed'));

        const { queryByHintText } = renderTokenIcon({
            symbol: ethSymbol,
            contractAddress: contractA,
        });

        await act(async () => {});

        expect(queryByHintText(tokenIconHint)).toBeNull();
    });

    it('does not reuse retry failure state after the size changes', async () => {
        (getAssetLogoContractAddresses as jest.Mock).mockImplementation(
            (_symbol: string, contract: string) => Promise.resolve([contract]),
        );

        const { getByHintText, queryByHintText, rerender } = renderTokenIcon({
            symbol: ethSymbol,
            contractAddress: contractA,
            size: 32,
        });
        await act(async () => {});

        // the only url candidate fails, so the placeholder is shown
        fireEvent(getByHintText(tokenIconHint), 'error', { nativeEvent: {} });
        expect(queryByHintText(tokenIconHint)).toBeNull();

        rerender(<TokenIcon symbol={ethSymbol} contractAddress={contractA} size={64} />);
        await act(async () => {});

        expect(JSON.stringify(getByHintText(tokenIconHint).props.source)).toContain(
            getTokenIconUrl(contractA, 64),
        );
    });

    it('should render without network icon for networks that are not l2 networks = op, arb, base', async () => {
        const { getByHintText, getByLabelText, queryByHintText } = renderTokenIcon({
            symbol: btcSymbol,
            showNetworkIcon: true,
        });

        // network icon decision is synchronous; token image requires async resolution
        expect(queryByHintText(networkIconHint)).toBeNull();
        await waitFor(() => {
            expect(getByHintText(tokenIconHint)).toBeTruthy();
            expect(getByLabelText('BTC')).toBeTruthy();
            expect(queryByHintText(networkIconHint)).toBeNull();
        });
    });

    it('should render network with network icon for l2 networks = op, arb, base and ETH as icon', async () => {
        const { getByHintText, getByLabelText, queryByHintText } = renderTokenIcon({
            symbol: opSymbol,
            showNetworkIcon: true,
        });

        expect(queryByHintText(networkIconHint)).toBeTruthy();
        await waitFor(() => {
            expect(getByHintText(tokenIconHint)).toBeTruthy();
            expect(getByLabelText('ETH')).toBeTruthy();
            expect(queryByHintText(networkIconHint)).toBeTruthy();
        });
    });

    it('should render with network icon for contracts', async () => {
        const contract = '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo' as TokenAddress;
        const { getByHintText, getByLabelText } = renderTokenIcon({
            symbol: opSymbol,
            contractAddress: contract,
            showNetworkIcon: true,
        });

        expect(getByHintText(networkIconHint)).toBeTruthy();
        await waitFor(() => {
            expect(getByHintText(tokenIconHint)).toBeTruthy();
            expect(getByLabelText(`op:${contract}`)).toBeTruthy();
            expect(getByHintText(networkIconHint)).toBeTruthy();
        });
    });

    describe('wrappedTokenIcon', () => {
        const wethContract = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as TokenAddress;

        it('renders the native icon with a network badge for a wrapped-native token when set to network', async () => {
            const { getByHintText, getByLabelText } = renderTokenIcon({
                symbol: ethSymbol,
                contractAddress: wethContract,
                showNetworkIcon: true,
                wrappedTokenIcon: 'network',
            });

            expect(getByHintText(networkIconHint)).toBeTruthy();
            await waitFor(() => {
                expect(getByHintText(tokenIconHint)).toBeTruthy();
                expect(getByLabelText('ETH')).toBeTruthy();
            });
        });

        it('keeps the wrapped-native token icon by default', async () => {
            (getAssetLogoContractAddresses as jest.Mock).mockImplementation(
                (_symbol: string, contract: string) => Promise.resolve([contract]),
            );

            const { getByHintText, getByLabelText } = renderTokenIcon({
                symbol: ethSymbol,
                contractAddress: wethContract,
                showNetworkIcon: true,
            });

            await waitFor(() => {
                expect(getByLabelText(`eth:${wethContract}`)).toBeTruthy();
                expect(JSON.stringify(getByHintText(tokenIconHint).props.source)).toContain(
                    getTokenIconUrl(wethContract),
                );
            });
        });

        it('keeps the token icon for a non-wrapped token even when set to network', async () => {
            (getAssetLogoContractAddresses as jest.Mock).mockImplementation(
                (_symbol: string, contract: string) => Promise.resolve([contract]),
            );

            const { getByLabelText } = renderTokenIcon({
                symbol: ethSymbol,
                contractAddress: contractA,
                showNetworkIcon: true,
                wrappedTokenIcon: 'network',
            });

            await waitFor(() => {
                expect(getByLabelText(`eth:${contractA}`)).toBeTruthy();
            });
        });
    });
});
