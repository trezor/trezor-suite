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
    beforeEach(() => {
        jest.mocked(getAssetLogoContractAddresses).mockImplementation((_symbol, contract) =>
            contract ? [contract] : [],
        );
    });

    const renderTokenIcon = async (props: React.ComponentProps<typeof TokenIcon>) =>
        await renderWithBasicProvider(<TokenIcon {...props} />);

    it('renders the correct icon synchronously when a recycled instance receives new props', async () => {
        const fresh = await renderTokenIcon({ symbol: ethSymbol });
        const ethSource = fresh.getByHintText(tokenIconHint).props.source;
        await fresh.unmount();

        const { getByHintText, rerender } = await renderTokenIcon({
            symbol: btcSymbol,
        });

        // simulates FlashList cell recycling: same mounted instance, new asset props
        await rerender(<TokenIcon symbol={ethSymbol} />);

        // native network icons resolve synchronously, so there is no placeholder frame
        expect(getByHintText(tokenIconHint).props.source).toEqual(ethSource);
    });

    it('shows token initials until the resolved logo is displayed', async () => {
        (getAssetLogoContractAddresses as jest.Mock).mockImplementation(
            (_symbol: string, contract: string) => [contract],
        );

        const { getByHintText, getByText, queryByText } = await renderTokenIcon({
            symbol: ethSymbol,
            contractAddress: contractA,
            placeholder: 'USDC',
        });

        expect(getByText('U')).toBeTruthy();
        expect(getByHintText(tokenIconHint).props.placeholder).toBeUndefined();

        expect(JSON.stringify(getByHintText(tokenIconHint).props.source)).toContain(
            getTokenIconUrl(contractA),
        );
        await fireEvent(getByHintText(tokenIconHint), 'display');
        expect(queryByText('U')).toBeNull();
    });

    it('ignores a stale async url resolution that arrives after the instance was recycled', async () => {
        const deferredA = createDeferred<string[]>();
        (getAssetLogoContractAddresses as jest.Mock).mockImplementation(
            (_symbol: string, contract: string) =>
                contract === contractA ? deferredA.promise : Promise.resolve([contract]),
        );

        const { getByHintText, getByText, rerender } = await renderTokenIcon({
            symbol: ethSymbol,
            contractAddress: contractA,
            placeholder: 'USDC',
        });

        expect(getByText('U')).toBeTruthy();

        await rerender(<TokenIcon symbol={ethSymbol} contractAddress={contractB} />);

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

        const { queryByHintText, getByText } = await renderTokenIcon({
            symbol: ethSymbol,
            contractAddress: contractA,
            placeholder: 'USDC',
        });

        await act(async () => {});

        expect(queryByHintText(tokenIconHint)).toBeNull();
        expect(getByText('U')).toBeTruthy();
    });

    it.each([
        { placeholder: 'USDC', initial: 'U' },
        { placeholder: 'Dai Stablecoin', initial: 'D' },
        { placeholder: undefined, initial: 'T' },
        { placeholder: '', initial: 'T' },
    ])(
        'keeps $initial after all logo candidates fail ($placeholder)',
        async ({ placeholder, initial }) => {
            jest.mocked(getAssetLogoContractAddresses).mockReturnValue([contractA, contractB]);
            const { getByHintText, getByText, queryByHintText } = await renderTokenIcon({
                symbol: ethSymbol,
                contractAddress: contractA,
                placeholder,
            });

            await fireEvent(getByHintText(tokenIconHint), 'error');
            expect(JSON.stringify(getByHintText(tokenIconHint).props.source)).toContain(
                getTokenIconUrl(contractB),
            );
            expect(getByText(initial)).toBeTruthy();

            await fireEvent(getByHintText(tokenIconHint), 'error');
            expect(queryByHintText(tokenIconHint)).toBeNull();
            expect(getByText(initial)).toBeTruthy();
        },
    );

    it.each([{ addresses: undefined }, { addresses: [] }])(
        'shows initials instead of a network logo when addresses resolve to $addresses',
        async ({ addresses }) => {
            jest.mocked(getAssetLogoContractAddresses).mockReturnValue(addresses);
            const { getByText, queryByHintText } = await renderTokenIcon({
                symbol: ethSymbol,
                contractAddress: contractA,
                placeholder: 'USDC',
            });

            expect(getByText('U')).toBeTruthy();
            expect(queryByHintText(tokenIconHint)).toBeNull();
        },
    );

    it('resets displayed initials when a loaded list row is recycled for another token', async () => {
        const { getByHintText, getByText, queryByText, rerender } = await renderTokenIcon({
            symbol: ethSymbol,
            contractAddress: contractA,
            placeholder: 'USDC',
        });
        await fireEvent(getByHintText(tokenIconHint), 'display');
        expect(queryByText('U')).toBeNull();

        await rerender(
            <TokenIcon symbol={ethSymbol} contractAddress={contractB} placeholder="DAI" />,
        );
        expect(getByText('D')).toBeTruthy();
        expect(queryByText('U')).toBeNull();
        await fireEvent(getByHintText(tokenIconHint), 'display');
        expect(queryByText('D')).toBeNull();
    });

    it('does not reuse retry failure state after the size changes', async () => {
        (getAssetLogoContractAddresses as jest.Mock).mockImplementation(
            (_symbol: string, contract: string) => Promise.resolve([contract]),
        );

        const { getByHintText, queryByHintText, rerender } = await renderTokenIcon({
            symbol: ethSymbol,
            contractAddress: contractA,
            size: 32,
        });
        await act(async () => {});

        // the only url candidate fails, so the placeholder is shown
        await fireEvent(getByHintText(tokenIconHint), 'error', { nativeEvent: {} });
        expect(queryByHintText(tokenIconHint)).toBeNull();

        await rerender(<TokenIcon symbol={ethSymbol} contractAddress={contractA} size={64} />);
        await act(async () => {});

        expect(JSON.stringify(getByHintText(tokenIconHint).props.source)).toContain(
            getTokenIconUrl(contractA, 64),
        );
    });

    it('should render without network icon for networks that are not l2 networks = op, arb, base', async () => {
        const { getByHintText, getByLabelText, queryByHintText } = await renderTokenIcon({
            symbol: btcSymbol,
            showNetworkIcon: true,
        });

        expect(queryByHintText(networkIconHint)).toBeNull();
        await waitFor(() => {
            expect(getByHintText(tokenIconHint)).toBeTruthy();
            expect(getByLabelText('BTC')).toBeTruthy();
            expect(queryByHintText(networkIconHint)).toBeNull();
        });
    });

    it('should render network with network icon for l2 networks = op, arb, base and ETH as icon', async () => {
        const { getByHintText, getByLabelText, queryByHintText } = await renderTokenIcon({
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
        const { getByHintText, getByLabelText } = await renderTokenIcon({
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
            const { getByHintText, getByLabelText } = await renderTokenIcon({
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

            const { getByHintText, getByLabelText } = await renderTokenIcon({
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

            const { getByLabelText } = await renderTokenIcon({
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
