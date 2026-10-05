import React from 'react';

import {
    type NetworkIconDep,
    type NetworkModuleRepositoryDep,
    createNetworkIcon,
    createNetworkModuleRepository,
    createNetworkModulesCompositionRoot,
} from '@suite-common/networks';
import { asNetworkSymbol, getCoingeckoId } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { act, fireEvent, renderWithBasicProvider, waitFor } from '@suite-native/test-utils';
import { getAssetLogoUrl } from '@trezor/asset-utils';
import { mock } from '@trezor/dependency-injection';
import { createDeferred } from '@trezor/utils';

import { TokenIcon } from './TokenIcon';

const ethSymbol = asNetworkSymbol('eth');
const networkModules = createNetworkModulesCompositionRoot({ getTrezorConnect: mock() });
const networkModuleRepository = createNetworkModuleRepository({ networkModules });
const ethereumModule = networkModuleRepository.get(ethSymbol);
const getTokenLogoIdentifiers = mock<typeof ethereumModule.icon.getTokenLogoIdentifiers>();
ethereumModule.icon = { ...ethereumModule.icon, getTokenLogoIdentifiers };

const tokenIconHint = 'Token Icon';
const networkIconHint = 'Network Icon';

const contractA = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const contractB = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const btcSymbol = asNetworkSymbol('btc');
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
        getTokenLogoIdentifiers.mockImplementation((_symbol, contract) =>
            contract ? [contract] : [],
        );
    });
    const renderTokenIcon = async (props: React.ComponentProps<typeof TokenIcon>) =>
        await renderWithBasicProvider(<TokenIcon {...props} />, {
            services: {
                networks: {
                    networkModuleRepository,
                    networkIcon: createNetworkIcon({ networkModuleRepository }),
                },
            },
        });

    it('uses the injected network icon service for the BNB display symbol', async () => {
        const services: NetworkIconDep & NetworkModuleRepositoryDep = {
            networkModuleRepository,
            networkIcon: {
                ...createNetworkIcon({ networkModuleRepository }),
                getIcon: mock(() => ({
                    coin: 'module-bnb.svg',
                    network: 'bsc.svg',
                    testnet: false,
                })),
            },
        };
        const { getByHintText } = await renderWithBasicProvider(
            <TokenIcon networkSymbol="BNB" tokenSymbol="BNB" />,
            { services: { networks: services } },
        );

        expect(JSON.stringify(getByHintText(tokenIconHint).props.source)).toContain(
            'module-bnb.svg',
        );
        expect(services.networkIcon.getIcon).toHaveBeenCalledWith(asNetworkSymbol('bsc'));
    });

    it('retries token logo identifiers in the order supplied by the network service', async () => {
        getTokenLogoIdentifiers.mockReturnValue([contractA, contractB]);
        const { getByHintText } = await renderTokenIcon({
            networkSymbol: ethSymbol,
            tokenSymbol: 'USDC',
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
        const fresh = await renderTokenIcon({ tokenSymbol: ethSymbol, networkSymbol: ethSymbol });
        const ethSource = fresh.getByHintText(tokenIconHint).props.source;
        await fresh.unmount();

        const { getByHintText, rerender } = await renderTokenIcon({
            tokenSymbol: btcSymbol,
            networkSymbol: btcSymbol,
        });

        // simulates FlashList cell recycling: same mounted instance, new asset props
        await rerender(<TokenIcon tokenSymbol={ethSymbol} networkSymbol={ethSymbol} />);

        // native network icons resolve synchronously, so there is no placeholder frame
        expect(getByHintText(tokenIconHint).props.source).toEqual(ethSource);
    });

    it('shows token initials until the resolved logo is displayed', async () => {
        getTokenLogoIdentifiers.mockImplementation((_symbol, contract) =>
            contract ? [contract] : [],
        );

        const { getByHintText, getByText, queryByText } = await renderTokenIcon({
            networkSymbol: ethSymbol,
            contractAddress: contractA,
            tokenSymbol: 'USDC',
        });

        expect(getByText('U')).toBeTruthy();
        expect(getByHintText(tokenIconHint).props.placeholder).toEqual([]);

        expect(JSON.stringify(getByHintText(tokenIconHint).props.source)).toContain(
            getTokenIconUrl(contractA),
        );
        await fireEvent(getByHintText(tokenIconHint), 'display');
        expect(queryByText('U')).toBeNull();
    });

    it('ignores a stale async url resolution that arrives after the instance was recycled', async () => {
        const deferredA = createDeferred<string[]>();
        getTokenLogoIdentifiers.mockImplementation((_symbol, contract) =>
            contract === contractA
                ? deferredA.promise
                : Promise.resolve(contract ? [contract] : []),
        );

        const { getByHintText, getByText, rerender } = await renderTokenIcon({
            networkSymbol: ethSymbol,
            contractAddress: contractA,
            tokenSymbol: 'USDC',
        });

        expect(getByText('U')).toBeTruthy();

        await rerender(
            <TokenIcon tokenSymbol="USDC" networkSymbol={ethSymbol} contractAddress={contractB} />,
        );

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

        const { queryByHintText, getByText } = await renderTokenIcon({
            networkSymbol: ethSymbol,
            contractAddress: contractA,
            tokenSymbol: 'USDC',
        });

        await act(async () => {});

        expect(queryByHintText(tokenIconHint)).toBeNull();
        expect(getByText('U')).toBeTruthy();
    });

    it.each([
        { tokenSymbol: 'USDC', initial: 'U' },
        { tokenSymbol: 'Dai Stablecoin', initial: 'D' },
        { tokenSymbol: null, initial: 'T' },
        { tokenSymbol: undefined, initial: 'T' },
        { tokenSymbol: '', initial: 'T' },
    ])(
        'keeps $initial after all logo candidates fail ($tokenSymbol)',
        async ({ tokenSymbol, initial }) => {
            getTokenLogoIdentifiers.mockReturnValue([contractA, contractB]);
            const { getByHintText, getByText, queryByHintText } = await renderTokenIcon({
                networkSymbol: ethSymbol,
                contractAddress: contractA,
                tokenSymbol,
            });

            await fireEvent(getByHintText(tokenIconHint), 'error', {
                nativeEvent: { error: 'Logo unavailable' },
            });
            expect(JSON.stringify(getByHintText(tokenIconHint).props.source)).toContain(
                getTokenIconUrl(contractB),
            );
            expect(getByText(initial)).toBeTruthy();

            await fireEvent(getByHintText(tokenIconHint), 'error', {
                nativeEvent: { error: 'Logo unavailable' },
            });
            expect(queryByHintText(tokenIconHint)).toBeNull();
            expect(getByText(initial)).toBeTruthy();
        },
    );

    it.each([{ addresses: [] }])(
        'shows initials instead of a network logo when addresses resolve to $addresses',
        async ({ addresses }) => {
            getTokenLogoIdentifiers.mockReturnValue(addresses);
            const { getByText, queryByHintText } = await renderTokenIcon({
                networkSymbol: ethSymbol,
                contractAddress: contractA,
                tokenSymbol: 'USDC',
            });

            expect(getByText('U')).toBeTruthy();
            expect(queryByHintText(tokenIconHint)).toBeNull();
        },
    );

    it('resets displayed initials when a loaded list row is recycled for another token', async () => {
        const { getByHintText, getByText, queryByText, rerender } = await renderTokenIcon({
            networkSymbol: ethSymbol,
            contractAddress: contractA,
            tokenSymbol: 'USDC',
        });
        await fireEvent(getByHintText(tokenIconHint), 'display');
        expect(queryByText('U')).toBeNull();

        await rerender(
            <TokenIcon networkSymbol={ethSymbol} contractAddress={contractB} tokenSymbol="DAI" />,
        );
        expect(getByText('D')).toBeTruthy();
        expect(queryByText('U')).toBeNull();
        await fireEvent(getByHintText(tokenIconHint), 'display');
        expect(queryByText('D')).toBeNull();
    });

    it('does not reuse retry failure state after the size changes', async () => {
        getTokenLogoIdentifiers.mockImplementation((_symbol, contract) =>
            Promise.resolve(contract ? [contract] : []),
        );

        const { getByHintText, queryByHintText, rerender } = await renderTokenIcon({
            tokenSymbol: 'USDC',
            networkSymbol: ethSymbol,
            contractAddress: contractA,
            size: 32,
        });
        await act(async () => {});

        // the only url candidate fails, so the placeholder is shown
        await fireEvent(getByHintText(tokenIconHint), 'error', { nativeEvent: {} });
        expect(queryByHintText(tokenIconHint)).toBeNull();

        await rerender(
            <TokenIcon
                tokenSymbol="USDC"
                networkSymbol={ethSymbol}
                contractAddress={contractA}
                size={64}
            />,
        );
        await act(async () => {});

        expect(JSON.stringify(getByHintText(tokenIconHint).props.source)).toContain(
            getTokenIconUrl(contractA, 64),
        );
    });

    it('should render without network icon for networks that are not l2 networks = op, arb, base', async () => {
        const { getByHintText, getByLabelText, queryByHintText } = await renderTokenIcon({
            tokenSymbol: btcSymbol,
            networkSymbol: btcSymbol,
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
            tokenSymbol: opSymbol,
            networkSymbol: opSymbol,
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
            tokenSymbol: 'USDC',
            networkSymbol: opSymbol,
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
                tokenSymbol: 'WETH',
                networkSymbol: ethSymbol,
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
            getTokenLogoIdentifiers.mockImplementation((_symbol, contract) =>
                Promise.resolve(contract ? [contract] : []),
            );

            const { getByHintText, getByLabelText } = await renderTokenIcon({
                tokenSymbol: 'WETH',
                networkSymbol: ethSymbol,
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
            getTokenLogoIdentifiers.mockImplementation((_symbol, contract) =>
                Promise.resolve(contract ? [contract] : []),
            );

            const { getByLabelText } = await renderTokenIcon({
                tokenSymbol: 'USDC',
                networkSymbol: ethSymbol,
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
