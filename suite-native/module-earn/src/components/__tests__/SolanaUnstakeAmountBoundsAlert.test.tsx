import { type Account } from '@suite-common/wallet-types';
import { Form, useForm } from '@suite-native/forms';
import {
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    userEvent,
} from '@suite-native/test-utils-store';
import { type SolanaStakingAccount } from '@trezor/blockchain-link-types';
import { StakeState } from '@trezor/network-solana/constants';

import { type EarnFormValues } from '../../earnFormSchema';
import { type UnstakeFormContext, unstakeFormValidationSchema } from '../../unstakeFormSchema';
import { SolanaUnstakeAmountBoundsAlert } from '../SolanaUnstakeAmountBoundsAlert';

const SOL = 1_000_000_000;

const buildStakingAccount = (
    overrides: Partial<SolanaStakingAccount> = {},
): SolanaStakingAccount => ({
    status: StakeState.Active,
    stake: `${SOL}`,
    rentExemptReserve: '2282880',
    ...overrides,
});

const buildSolanaAccount = (solStakingAccounts: SolanaStakingAccount[]): Account =>
    ({
        symbol: 'sol',
        networkType: 'solana',
        formattedBalance: '0',
        misc: { solStakingAccounts },
    }) as unknown as Account;

const buildEthereumAccount = (): Account =>
    ({
        symbol: 'eth',
        networkType: 'ethereum',
        formattedBalance: '0',
        misc: {},
    }) as unknown as Account;

const translate = ((id: string) => id) as UnstakeFormContext['translate'];

const renderAlert = (account: Account, amountValue: string) => {
    const { result } = renderHookWithStoreProvider(() =>
        useForm<EarnFormValues>({
            validation: unstakeFormValidationSchema,
            mode: 'onTouched',
            context: { account, translate },
            defaultValues: { amount: amountValue, fiat: '' },
        }),
    );
    const form = result.current;

    return {
        form,
        ...renderWithStoreProvider(
            <SolanaUnstakeAmountBoundsAlert account={account} amountValue={amountValue} />,
            { wrapper: ({ children }) => <Form form={form}>{children}</Form> },
        ),
    };
};

describe('SolanaUnstakeAmountBoundsAlert', () => {
    it('renders nothing for a valid amount', () => {
        const account = buildSolanaAccount([buildStakingAccount({ stake: `${3.12 * SOL}` })]);
        const { toJSON } = renderAlert(account, '1.5');

        expect(toJSON()).toBeNull();
    });

    it('renders nothing for a non-Solana account', () => {
        const account = buildEthereumAccount();
        const { toJSON } = renderAlert(account, '0.5');

        expect(toJSON()).toBeNull();
    });

    it('renders both suggested amounts when a lower bound exists', () => {
        const account = buildSolanaAccount([
            buildStakingAccount({ stake: `${2 * SOL}` }),
            buildStakingAccount({ stake: `${1.42 * SOL}` }),
        ]);
        const { getByText } = renderAlert(account, '2');

        expect(getByText('1.42 SOL')).toBeTruthy();
        expect(getByText('2.42 SOL')).toBeTruthy();
    });

    it('renders only the higher suggested amount when there is no valid lower bound', () => {
        const account = buildSolanaAccount([buildStakingAccount({ stake: `${1.42 * SOL}` })]);
        const { getByText } = renderAlert(account, '0.5');

        expect(getByText('1.42 SOL')).toBeTruthy();
    });

    it('fills in the amount when a suggested value is pressed', async () => {
        const account = buildSolanaAccount([buildStakingAccount({ stake: `${1.42 * SOL}` })]);
        const { getByText, form } = renderAlert(account, '0.5');

        await userEvent.press(getByText('1.42 SOL'));

        expect(form.getValues('amount')).toBe('1.42');
    });
});
