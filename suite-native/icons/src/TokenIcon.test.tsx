import React from 'react';

import { mock } from '@suite-common/dependency-injection';
import {
    createNetworkModuleRepository,
    createNetworkModulesCompositionRoot,
} from '@suite-common/networks';
import { asNetworkSymbol, getCoingeckoId } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { act, fireEvent, renderWithBasicProvider, waitFor } from '@suite-native/test-utils';
import { getAssetLogoUrl } from '@trezor/asset-utils';
import { createDeferred } from '@trezor/utils';

import { TokenIcon } from './TokenIcon';

const networkModules = createNetworkModulesCompositionRoot({ getTrezorConnect: mock() });
const getTokenLogoIdentifiers = mock<typeof networkModules.ethereum.icon.getTokenLogoIdentifiers>();
networkModules.ethereum.icon = { ...networkModules.ethereum.icon, getTokenLogoIdentifiers };
const networkModuleRepository = createNetworkModuleRepository({ networkModules });

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
        getTokenLogoIdentifiers.mockImplementation((_symbol, contract) => [contract]);
    });
    const renderTokenIcon = async (props: React.ComponentProps<typeof TokenIcon>) =>
        await renderWithBasicProvider(<TokenIcon {...props} />, {
            services: { networks: { networkModuleRepository } },
        });

    it('retries token logo identifiers in the order supplied by the network service', async () => {
        getTokenLogoIdentifiers.mockReturnValue([contractA, contractB]);
        const { getByHintText } = await renderTokenIcon({
            symbol: ethSymbol,
            contractAddress: contractA,
        });

        expect(JSON.stringify(getByHintText(tokenIconHint).props.source)).toContain(
            getTokenIconUrl(contractA),
        );
        await fireEvent(getByHintText(tokenIconHint), 'error', { nativeEvent: {} });
        expect(JSON.stringify(getByHintText(tokenIconHint).props.source)).toContain(
            getTokenIconUrl(contractB),
        );
    });

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

    it('renders a synchronously resolved token icon without a placeholder frame', async () => {
        getTokenLogoIdentifiers.mockImplementation((_symbol: string, contract: string) => [
            contract,
        ]);

        const { getByHintText } = await renderTokenIcon({
            symbol: ethSymbol,
            contractAddress: contractA,
        });

        expect(JSON.stringify(getByHintText(tokenIconHint).props.source)).toContain(
            getTokenIconUrl(contractA),
        );
    });

    it('ignores a stale async url resolution that arrives after the instance was recycled', async () => {
        const deferredA = createDeferred<string[]>();
        getTokenLogoIdentifiers.mockImplementation((_symbol: string, contract: string) =>
            contract === contractA ? deferredA.promise : Promise.resolve([contract]),
        );

        const { getByHintText, rerender } = await renderTokenIcon({
            symbol: ethSymbol,
            contractAddress: contractA,
        });

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
        getTokenLogoIdentifiers.mockRejectedValue(new Error('failed'));

        const { queryByHintText } = await renderTokenIcon({
            symbol: ethSymbol,
            contractAddress: contractA,
        });

        await act(async () => {});

        expect(queryByHintText(tokenIconHint)).toBeNull();
    });

    it('does not reuse retry failure state after the size changes', async () => {
        getTokenLogoIdentifiers.mockImplementation((_symbol: string, contract: string) =>
            Promise.resolve([contract]),
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
            getTokenLogoIdentifiers.mockImplementation((_symbol: string, contract: string) =>
                Promise.resolve([contract]),
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
            getTokenLogoIdentifiers.mockImplementation((_symbol: string, contract: string) =>
                Promise.resolve([contract]),
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
