import { type Account, type FormState } from '@suite-common/wallet-types';
import { tronUtils } from '@trezor/blockchain-link-utils';

export const buildWithdrawBalanceContract = ({ ownerHex }: { ownerHex: string }) =>
    ({
        type: 'WithdrawBalanceContract' as const,
        parameter: {
            value: {
                owner_address: ownerHex,
            },
        },
    }) as const;

export type TronClaimContract = ReturnType<typeof buildWithdrawBalanceContract>;

export const buildClaimContract = (account: Account) => {
    const ownerHex = tronUtils.tronAddressToHex(account.descriptor);

    if (!ownerHex) {
        return null;
    }

    return buildWithdrawBalanceContract({ ownerHex });
};

export const buildClaimReviewForm = (): FormState => ({
    outputs: [],
    feePerUnit: '0',
    feeLimit: '',
    options: ['broadcast'],
    tronStaking: { kind: 'claim' },
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
});
