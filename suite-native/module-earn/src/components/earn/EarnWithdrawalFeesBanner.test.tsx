import { getMaxStakeAmount } from '@suite-common/wallet-core';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { networkAmountToSmallestUnit } from '@suite-common/wallet-utils';
import { Form, useForm } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import {
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';

import { EarnWithdrawalFeesBanner } from './EarnWithdrawalFeesBanner';
import {
    type EarnFormContext,
    type EarnFormValues,
    earnFormValidationSchema,
} from '../../utils/earn/earnFormSchema';

const SOL_WITHDRAWAL_RESERVE = '0.02';

const translate = ((id: string) => id) as EarnFormContext['translate'];

const renderBanner = async ({
    balance,
    amount,
    isMaxSelected,
}: {
    balance: string;
    amount: string;
    isMaxSelected: boolean;
}) => {
    const account = mockWalletAccount({
        symbol: 'sol',
        availableBalance: networkAmountToSmallestUnit(balance, 'sol'),
    });

    const { result } = await renderHookWithStoreProvider(() =>
        useForm<EarnFormValues>({
            validation: earnFormValidationSchema,
            mode: 'onTouched',
            context: { symbol: 'sol', availableBalance: balance, decimals: 9, translate },
            defaultValues: { amount, fiat: '' },
        }),
    );
    const form = result.current;

    return await renderWithStoreProvider(
        <EarnWithdrawalFeesBanner
            accountKey={account.key}
            symbol="sol"
            isMaxSelected={isMaxSelected}
        />,
        {
            preloadedState: { wallet: { accounts: [account] } },
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        },
    );
};

describe('EarnWithdrawalFeesBanner', () => {
    it('renders nothing for a manually entered amount that leaves the withdrawal reserve intact', async () => {
        const { toJSON } = await renderBanner({ balance: '5', amount: '4', isMaxSelected: false });

        expect(toJSON()).toBeNull();
    });

    it('recommends the reserve for a manually entered amount that eats into it', async () => {
        const { getByText } = await renderBanner({
            balance: '5',
            amount: '4.99',
            isMaxSelected: false,
        });

        expect(
            getByText(
                getTranslation('earn.earnFormScreen.withdrawalFeesRecommendation', {
                    amount: SOL_WITHDRAWAL_RESERVE,
                    displaySymbol: 'SOL',
                }),
            ),
        ).toBeTruthy();
    });

    it('confirms the kept reserve for the stake max amount, which leaves exactly the reserve', async () => {
        const balance = '5';
        const { getByText } = await renderBanner({
            balance,
            amount: getMaxStakeAmount({ balance, symbol: 'sol' }),
            isMaxSelected: true,
        });

        expect(
            getByText(
                getTranslation('earn.earnFormScreen.withdrawalFeesBanner', {
                    amount: SOL_WITHDRAWAL_RESERVE,
                    displaySymbol: 'SOL',
                }),
            ),
        ).toBeTruthy();
    });

    it('recommends the reserve when stake max can only leave the smaller fee buffer', async () => {
        // Below MIN_SOL_BALANCE_FOR_STAKING the max amount reserves the 0.005 fee buffer only.
        const balance = '1.01';
        const { getByText } = await renderBanner({
            balance,
            amount: getMaxStakeAmount({ balance, symbol: 'sol' }),
            isMaxSelected: true,
        });

        expect(
            getByText(
                getTranslation('earn.earnFormScreen.withdrawalFeesRecommendation', {
                    amount: SOL_WITHDRAWAL_RESERVE,
                    displaySymbol: 'SOL',
                }),
            ),
        ).toBeTruthy();
    });
});
