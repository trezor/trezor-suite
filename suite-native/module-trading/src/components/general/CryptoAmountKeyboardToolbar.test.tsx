import { type PropsWithChildren } from 'react';

import { getTranslation } from '@suite-native/intl';
import { userEvent } from '@suite-native/test-utils-store';
import { btc1NormalAccount, btcAsset } from '@suite-native/trading-fixtures';
import { PROTO } from '@trezor/connect';

import { CryptoAmountKeyboardToolbar } from './CryptoAmountKeyboardToolbar';
import { renderWithTradingProvider } from '../../test-utils/tradingTestUtils';

jest.mock('@suite-native/keyboard', () => ({
    KeyboardToolbarPortal: ({ children }: PropsWithChildren) => <>{children}</>,
}));

describe('CryptoAmountKeyboardToolbar', () => {
    it('uses spendable amount for Max and balance for percentage buttons', async () => {
        const onSelectAmount = jest.fn();
        const { getByText } = await renderWithTradingProvider(
            <CryptoAmountKeyboardToolbar
                accountKey={btc1NormalAccount.key}
                symbol={btc1NormalAccount.symbol}
                contractAddress={btcAsset.contractAddress}
                decimals={8}
                maxSpendableAmount="0.009"
                onSelectAmount={onSelectAmount}
            />,
            { tradeType: 'exchange' },
        );

        await userEvent.press(getByText('25%'));
        expect(onSelectAmount).toHaveBeenLastCalledWith('0.0025');

        await userEvent.press(getByText(getTranslation('moduleTrading.keyboardToolbar.max')));
        expect(onSelectAmount).toHaveBeenLastCalledWith('0.009');
    });

    it('disables Max while the spendable amount is unavailable', async () => {
        const onSelectAmount = jest.fn();
        const { getByText } = await renderWithTradingProvider(
            <CryptoAmountKeyboardToolbar
                accountKey={btc1NormalAccount.key}
                symbol={btc1NormalAccount.symbol}
                contractAddress={btcAsset.contractAddress}
                decimals={8}
                maxSpendableAmount={undefined}
                onSelectAmount={onSelectAmount}
            />,
            { tradeType: 'exchange' },
        );

        await userEvent.press(getByText(getTranslation('moduleTrading.keyboardToolbar.max')));
        expect(onSelectAmount).not.toHaveBeenCalled();
    });

    it('converts the spendable amount to sats when selected', async () => {
        const onSelectAmount = jest.fn();
        const { getByText } = await renderWithTradingProvider(
            <CryptoAmountKeyboardToolbar
                accountKey={btc1NormalAccount.key}
                symbol={btc1NormalAccount.symbol}
                contractAddress={btcAsset.contractAddress}
                decimals={8}
                maxSpendableAmount="0.009"
                onSelectAmount={onSelectAmount}
            />,
            {
                tradeType: 'exchange',
                overrides: {
                    wallet: { settings: { bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI } },
                },
            },
        );

        await userEvent.press(getByText(getTranslation('moduleTrading.keyboardToolbar.max')));
        expect(onSelectAmount).toHaveBeenCalledWith('900000');
    });
});
