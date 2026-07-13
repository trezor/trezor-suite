import React from 'react';

import { getCoingeckoId } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { getAssetLogoContractAddresses } from '@suite-common/wallet-utils';
import { act, fireEvent, renderWithBasicProvider, waitFor } from '@suite-native/test-utils';
import { getAssetLogoUrl } from '@trezor/asset-utils';
import { createDeferred } from '@trezor/utils';

import { TokenIcon } from '../TokenIcon';

jest.mock('@suite-common/wallet-utils', () => ({
    ...jest.requireActual('@suite-common/wallet-utils'),
    getAssetLogoContractAddresses: jest.fn(),
}));

const tokenIconHint = 'Token Icon';
const networkIconHint = 'Network Icon';

const contractA = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const contractB = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

const getTokenIconUrl = (contractAddress: string, size = 32) =>
    getAssetLogoUrl({
        coingeckoId: getCoingeckoId('eth')!,
        contractAddress,
        density: 2,
        size,
    });

describe('TokenIcon', () => {
    it('renders the new asset icon immediately when a recycled instance receives new props', async () => {
        const fresh = renderWithBasicProvider(<TokenIcon symbol="eth" />);
        const ethSource = fresh.getByHintText(tokenIconHint).props.source;
        await act(async () => {});
        fresh.unmount();

        const { getByHintText, rerender } = renderWithBasicProvider(<TokenIcon symbol="btc" />);

        // simulates FlashList cell recycling: same mounted instance, new asset props
        rerender(<TokenIcon symbol="eth" />);

        expect(getByHintText(tokenIconHint).props.source).toEqual(ethSource);

        await act(async () => {});
        expect(getByHintText(tokenIconHint).props.source).toEqual(ethSource);
    });

    it('ignores a stale async url resolution that arrives after the instance was recycled', async () => {
        const deferredA = createDeferred<string[]>();
        (getAssetLogoContractAddresses as jest.Mock).mockImplementation(
            (_symbol: string, contract: string) =>
                contract === contractA ? deferredA.promise : Promise.resolve([contract]),
        );

        const { getByHintText, rerender } = renderWithBasicProvider(
            <TokenIcon symbol="eth" contractAddress={contractA} />,
        );

        rerender(<TokenIcon symbol="eth" contractAddress={contractB} />);

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

    it('keeps the bundled fallback icon when the url resolution rejects', async () => {
        (getAssetLogoContractAddresses as jest.Mock).mockRejectedValue(new Error('failed'));

        const { getByHintText } = renderWithBasicProvider(
            <TokenIcon symbol="eth" contractAddress={contractA} />,
        );

        await act(async () => {});

        expect(JSON.stringify(getByHintText(tokenIconHint).props.source)).not.toContain(
            getTokenIconUrl(contractA),
        );
    });

    it('does not reuse retry failure state after the size changes', async () => {
        (getAssetLogoContractAddresses as jest.Mock).mockImplementation(
            (_symbol: string, contract: string) => Promise.resolve([contract]),
        );

        const { getByHintText, queryByHintText, rerender } = renderWithBasicProvider(
            <TokenIcon symbol="eth" contractAddress={contractA} size={32} />,
        );
        await act(async () => {});

        // the only url candidate fails, so the placeholder is shown
        fireEvent(getByHintText(tokenIconHint), 'error', { nativeEvent: {} });
        expect(queryByHintText(tokenIconHint)).toBeNull();

        rerender(<TokenIcon symbol="eth" contractAddress={contractA} size={64} />);
        await act(async () => {});

        expect(JSON.stringify(getByHintText(tokenIconHint).props.source)).toContain(
            getTokenIconUrl(contractA, 64),
        );
    });

    it('should render without network icon for networks that are not l2 networks = op, arb, base', () => {
        const { getByHintText, getByLabelText, queryByHintText } = renderWithBasicProvider(
            <TokenIcon symbol="btc" showNetworkIcon />,
        );

        expect(getByHintText(tokenIconHint)).toBeTruthy();
        expect(getByLabelText('BTC')).toBeTruthy();
        expect(queryByHintText(networkIconHint)).toBeNull();
    });

    it('should render network with network icon for l2 networks = op, arb, base and ETH as icon', () => {
        const { getByHintText, getByLabelText, queryByHintText } = renderWithBasicProvider(
            <TokenIcon symbol="op" showNetworkIcon />,
        );

        expect(getByHintText(tokenIconHint)).toBeTruthy();
        expect(getByLabelText('ETH')).toBeTruthy();
        expect(queryByHintText(networkIconHint)).toBeTruthy();
    });

    it('should render with network icon for contracts', () => {
        const contract = '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo' as TokenAddress;
        const { getByHintText, getByLabelText } = renderWithBasicProvider(
            <TokenIcon symbol="op" contractAddress={contract} showNetworkIcon />,
        );

        expect(getByHintText(tokenIconHint)).toBeTruthy();
        expect(getByLabelText(`op:${contract}`)).toBeTruthy();
        expect(getByHintText(networkIconHint)).toBeTruthy();
    });
});
