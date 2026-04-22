import React from 'react';

import { type TokenAddress } from '@suite-common/wallet-types';
import { renderWithProviders } from '@suite-native/test-utils';

import { CryptoIconWithNetwork } from '../CryptoIconWithNetwork';

const cryptoIconHint = 'Crypto Icon';
const networkIconHint = 'Network Icon';

const renderIcon = (element: Parameters<typeof renderWithProviders>[0]) =>
    renderWithProviders(element, { providers: ['intl'] });

describe('CryptoIconWithNetwork', () => {
    it('should render without network icon for networks that are not l2 networks = op, arb, base', () => {
        const { getByHintText, getByLabelText, queryByHintText } = renderIcon(
            <CryptoIconWithNetwork symbol="btc" />,
        );

        expect(getByHintText(cryptoIconHint)).toBeTruthy();
        expect(getByLabelText('BTC')).toBeTruthy();
        expect(queryByHintText(networkIconHint)).toBeNull();
    });

    it('should render network with network icon for l2 networks = op, arb, base and ETH as icon', () => {
        const { getByHintText, getByLabelText, queryByHintText } = renderIcon(
            <CryptoIconWithNetwork symbol="op" />,
        );

        expect(getByHintText(cryptoIconHint)).toBeTruthy();
        expect(getByLabelText('ETH')).toBeTruthy();
        expect(queryByHintText(networkIconHint)).toBeTruthy();
    });

    it('should render with network icon for contracts', () => {
        const contract = '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo' as TokenAddress;
        const { getByHintText, getByLabelText } = renderIcon(
            <CryptoIconWithNetwork symbol="op" contractAddress={contract} />,
        );

        expect(getByHintText(cryptoIconHint)).toBeTruthy();
        expect(getByLabelText('op' + contract)).toBeTruthy();
        expect(getByHintText(networkIconHint)).toBeTruthy();
    });
});
