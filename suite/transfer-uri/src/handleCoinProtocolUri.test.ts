import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { type FindNetworkSymbolForProtocol } from '@suite-common/networks';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import {
    type CoinProtocol,
    type HandleCoinProtocolUriDeps,
    handleCoinProtocolUri,
} from './handleCoinProtocolUri';

const findNetworkSymbolForProtocol: FindNetworkSymbolForProtocol = protocol => {
    if (protocol === 'bitcoin') return asNetworkSymbol('btc');
    if (protocol === 'ethereum') return asNetworkSymbol('eth');

    return null;
};

const setup = () => {
    const dispatch = jest.fn();
    const report = jest.fn();
    const saveCoinProtocol = jest.fn((coinProtocol: CoinProtocol) => ({
        type: '@protocol/save-coin-protocol',
        payload: coinProtocol,
    }));

    const extra: HandleCoinProtocolUriDeps = {
        services: {
            analytics: mockDesktopAnalytics(report),
            findNetworkSymbolForProtocol,
        },
    };

    const run = (uri: string) =>
        handleCoinProtocolUri(uri, saveCoinProtocol)(dispatch, () => ({}), extra);

    return { dispatch, report, saveCoinProtocol, run };
};

describe('handleCoinProtocolUri', () => {
    it('reports the scheme, saves the protocol and toasts for a valid coin URI', () => {
        const { dispatch, report, saveCoinProtocol, run } = setup();

        run('bitcoin:12345abcde?amount=1.02&label=Alice');

        expect(report).toHaveBeenCalledWith(
            expect.objectContaining({ payload: { scheme: 'bitcoin', isAmountPresent: true } }),
        );
        expect(saveCoinProtocol).toHaveBeenCalledWith({
            scheme: 'bitcoin',
            address: '12345abcde',
            amount: '1.02',
            label: 'Alice',
            token: undefined,
            tokenAmount: undefined,
        });
        // save action + toast
        expect(dispatch).toHaveBeenCalledTimes(2);
    });

    it('maps an ERC-681 transfer to token + tokenAmount', () => {
        const { report, saveCoinProtocol, run } = setup();

        run(
            'ethereum:0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7/transfer?address=0x8e23ee67d1332ad560396262c48ffbb01f93d052&uint256=1000000',
        );

        expect(report).toHaveBeenCalledWith(
            expect.objectContaining({ payload: { scheme: 'ethereum', isAmountPresent: true } }),
        );
        expect(saveCoinProtocol).toHaveBeenCalledWith({
            scheme: 'ethereum',
            address: '0x8e23ee67d1332ad560396262c48ffbb01f93d052',
            amount: undefined,
            label: undefined,
            token: '0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7',
            tokenAmount: '1000000',
        });
    });

    it('reports an unknown scheme without saving or toasting', () => {
        const { dispatch, report, saveCoinProtocol, run } = setup();

        run('unknown:foo');

        expect(report).toHaveBeenCalledWith(
            expect.objectContaining({ payload: { scheme: 'unknown', isAmountPresent: false } }),
        );
        expect(saveCoinProtocol).not.toHaveBeenCalled();
        expect(dispatch).not.toHaveBeenCalled();
    });

    it('does nothing for a non-URI input', () => {
        const { dispatch, report, saveCoinProtocol, run } = setup();

        run('not-a-uri');

        expect(report).not.toHaveBeenCalled();
        expect(saveCoinProtocol).not.toHaveBeenCalled();
        expect(dispatch).not.toHaveBeenCalled();
    });
});
