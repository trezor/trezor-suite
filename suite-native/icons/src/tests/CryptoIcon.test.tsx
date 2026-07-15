import React from 'react';

import { getCoingeckoId } from '@suite-common/wallet-config';
import { getAssetLogoContractAddresses } from '@suite-common/wallet-utils';
import { act, fireEvent, renderWithBasicProvider, waitFor } from '@suite-native/test-utils';
import { getAssetLogoUrl } from '@trezor/asset-utils';
import { createDeferred } from '@trezor/utils';

import { CryptoIcon } from '../CryptoIcon';

jest.mock('@suite-common/wallet-utils', () => ({
    ...jest.requireActual('@suite-common/wallet-utils'),
    getAssetLogoContractAddresses: jest.fn(),
}));

const cryptoIconHint = 'Crypto Icon';

const contractA = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const contractB = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

const getTokenLogoUrl = (contractAddress: string, size = 32) =>
    getAssetLogoUrl({
        coingeckoId: getCoingeckoId('eth')!,
        contractAddress,
        density: 2,
        size,
    });

describe('CryptoIcon', () => {
    it('renders the new asset icon immediately when a recycled instance receives new props', async () => {
        const fresh = renderWithBasicProvider(<CryptoIcon symbol="eth" />);
        const ethSource = fresh.getByHintText(cryptoIconHint).props.source;
        await act(async () => {});
        fresh.unmount();

        const { getByHintText, rerender } = renderWithBasicProvider(<CryptoIcon symbol="btc" />);

        // simulates FlashList cell recycling: same mounted instance, new asset props
        rerender(<CryptoIcon symbol="eth" />);

        expect(getByHintText(cryptoIconHint).props.source).toEqual(ethSource);

        await act(async () => {});
        expect(getByHintText(cryptoIconHint).props.source).toEqual(ethSource);
    });

    it('ignores a stale async url resolution that arrives after the instance was recycled', async () => {
        const deferredA = createDeferred<string[]>();
        (getAssetLogoContractAddresses as jest.Mock).mockImplementation(
            (_symbol: string, contract: string) =>
                contract === contractA ? deferredA.promise : Promise.resolve([contract]),
        );

        const { getByHintText, rerender } = renderWithBasicProvider(
            <CryptoIcon symbol="eth" contractAddress={contractA} />,
        );

        rerender(<CryptoIcon symbol="eth" contractAddress={contractB} />);

        await waitFor(() => {
            expect(JSON.stringify(getByHintText(cryptoIconHint).props.source)).toContain(
                getTokenLogoUrl(contractB),
            );
        });

        deferredA.resolve([contractA]);
        await act(async () => {});

        expect(JSON.stringify(getByHintText(cryptoIconHint).props.source)).toContain(
            getTokenLogoUrl(contractB),
        );
    });

    it('keeps the bundled fallback icon when the url resolution rejects', async () => {
        (getAssetLogoContractAddresses as jest.Mock).mockRejectedValue(new Error('failed'));

        const { getByHintText } = renderWithBasicProvider(
            <CryptoIcon symbol="eth" contractAddress={contractA} />,
        );

        await act(async () => {});

        expect(JSON.stringify(getByHintText(cryptoIconHint).props.source)).not.toContain(
            getTokenLogoUrl(contractA),
        );
    });

    it('does not reuse retry failure state after the size changes', async () => {
        (getAssetLogoContractAddresses as jest.Mock).mockImplementation(
            (_symbol: string, contract: string) => Promise.resolve([contract]),
        );

        const { getByHintText, queryByHintText, rerender } = renderWithBasicProvider(
            <CryptoIcon symbol="eth" contractAddress={contractA} size={32} />,
        );
        await act(async () => {});

        // the only url candidate fails, so the placeholder is shown
        fireEvent(getByHintText(cryptoIconHint), 'error', { nativeEvent: {} });
        expect(queryByHintText(cryptoIconHint)).toBeNull();

        rerender(<CryptoIcon symbol="eth" contractAddress={contractA} size={64} />);
        await act(async () => {});

        expect(JSON.stringify(getByHintText(cryptoIconHint).props.source)).toContain(
            getTokenLogoUrl(contractA, 64),
        );
    });
});
