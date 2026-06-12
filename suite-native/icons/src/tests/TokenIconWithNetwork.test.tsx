import React from 'react';

import { type TokenAddress } from '@suite-common/wallet-types';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { TokenIconWithNetwork } from '../TokenIconWithNetwork';

const cryptoIconHint = 'Crypto Icon';
const networkIconHint = 'Network Icon';

describe('TokenIconWithNetwork', () => {
    it('should render without network icon for networks that are not l2 networks = op, arb, base', () => {
        const { getByHintText, getByLabelText, queryByHintText } = renderWithBasicProvider(
            <TokenIconWithNetwork symbol="btc" />,
        );

        expect(getByHintText(cryptoIconHint)).toBeTruthy();
        expect(getByLabelText('BTC')).toBeTruthy();
        expect(queryByHintText(networkIconHint)).toBeNull();
    });

    it('should render network with network icon for l2 networks = op, arb, base and ETH as icon', () => {
        const { getByHintText, getByLabelText, queryByHintText } = renderWithBasicProvider(
            <TokenIconWithNetwork symbol="op" />,
        );

        expect(getByHintText(cryptoIconHint)).toBeTruthy();
        expect(getByLabelText('ETH')).toBeTruthy();
        expect(queryByHintText(networkIconHint)).toBeTruthy();
    });

    it('should render with network icon for contracts', () => {
        const contract = '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo' as TokenAddress;
        const { getByHintText, getByLabelText } = renderWithBasicProvider(
            <TokenIconWithNetwork symbol="op" contractAddress={contract} />,
        );

        expect(getByHintText(cryptoIconHint)).toBeTruthy();
        expect(getByLabelText('op' + contract)).toBeTruthy();
        expect(getByHintText(networkIconHint)).toBeTruthy();
    });
});
