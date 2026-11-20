import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { renderWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { BigNumber } from '@trezor/utils';

import { AssetPriceChange } from './AssetPriceChange';

describe('AssetPriceChange', () => {
    it('keeps the sign of a value change whose percentage rounds to zero', async () => {
        await renderWithStoreProvider(
            <AssetPriceChange
                valueChange={asBaseCurrencyAmount(new BigNumber('-0.0000000001'))}
                percentageChange={-0.00001}
            />,
        );

        expect(screen.getByText('-')).toBeTruthy();
        expect(screen.getByText('0.00%')).toBeTruthy();
    });

    it('shows no sign for a zero value change', async () => {
        await renderWithStoreProvider(
            <AssetPriceChange
                valueChange={asBaseCurrencyAmount(new BigNumber(0))}
                percentageChange={0}
            />,
        );

        expect(screen.queryByText('-')).toBeNull();
        expect(screen.queryByText('+')).toBeNull();
    });
});
