import type { CryptoId } from 'invity-api';

import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { type MyAsset } from '@suite-native/trading-types';
import { BigNumber } from '@trezor/utils';

import { TokenIconGroup } from './TokenIconGroup';

const createAsset = (index: number): MyAsset => ({
    name: `Token ${index}`,
    symbol: 'eth',
    cryptoId: `ethereum--token-${index}` as CryptoId,
    balance: `${index}`,
    fiatBalance: asBaseCurrencyAmount(new BigNumber(index)),
    isEnabled: true,
});

describe('TokenIconGroup', () => {
    it('overlaps preview icons and the overflow badge', async () => {
        const testID = '@trading/token-icon-group';
        const { getByTestId, getByText } = await renderWithStoreProvider(
            <TokenIconGroup
                assets={[createAsset(1), createAsset(2), createAsset(3), createAsset(4)]}
                testID={testID}
            />,
        );

        expect(getByTestId(`${testID}/icon-0`)).toHaveStyle({ marginLeft: 0 });
        expect(getByTestId(`${testID}/icon-1`)).toHaveStyle({ marginLeft: -8 });
        expect(getByTestId(`${testID}/overflow`)).toHaveStyle({ marginLeft: -8 });
        expect(getByText('+2')).toBeOnTheScreen();
    });
});
