import React from 'react';

import { TokenAddress } from '@suite-common/wallet-types';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { CryptoIconWithNetwork } from '../CryptoIconWithNetwork';

const cryptoIconHint = 'Crypto Icon';
const networkIconHint = 'Network Icon';

describe('CryptoIconWithNetwork', () => {
    it('should render without network icon for networks that are not l2 networks = op, arb, base', () => {
        const { queryByHintText, queryByA11yHint } = renderWithBasicProvider(
            <CryptoIconWithNetwork symbol="btc" />,
        );

        expect(queryByHintText(cryptoIconHint)).toBeDefined();
        expect(queryByA11yHint('btc')).toBeDefined();
        expect(queryByHintText(networkIconHint)).toBeNull();
    });

    it('should render network with network icon for l2 networks = op, arb, base and ETH as icon', () => {
        const { queryByHintText, queryByA11yHint } = renderWithBasicProvider(
            <CryptoIconWithNetwork symbol="op" />,
        );

        expect(queryByHintText(cryptoIconHint)).toBeDefined();
        expect(queryByA11yHint('ETH')).toBeDefined();
        expect(queryByHintText(networkIconHint)).toBeDefined();
    });

    it('should render with network icon for contracts', () => {
        const contract = '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo' as TokenAddress;
        const { queryByHintText, queryByA11yHint } = renderWithBasicProvider(
            <CryptoIconWithNetwork symbol="op" contractAddress={contract} />,
        );

        expect(queryByHintText(cryptoIconHint)).toBeDefined();
        expect(queryByA11yHint('ETH' + contract)).toBeDefined();
        expect(queryByHintText(networkIconHint)).toBeDefined();
    });
});
