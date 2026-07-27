import { type Account, type FormState } from '@suite-common/wallet-types';
import * as tronUtils from '@trezor/network-tron/utils';

export const buildWithdrawExpireUnfreezeContract = ({ ownerHex }: { ownerHex: string }) =>
    ({
        type: 'WithdrawExpireUnfreezeContract' as const,
        parameter: {
            value: {
                owner_address: ownerHex,
            },
        },
    }) as const;

export type TronWithdrawContract = ReturnType<typeof buildWithdrawExpireUnfreezeContract>;

export const buildWithdrawContract = (account: Account) => {
    const ownerHex = tronUtils.tronAddressToHex(account.descriptor);

    if (!ownerHex) {
        return null;
    }

    return buildWithdrawExpireUnfreezeContract({ ownerHex });
};

export const buildWithdrawReviewForm = (): FormState => ({
    outputs: [],
    feePerUnit: '0',
    feeLimit: '',
    options: ['broadcast'],
    tronStaking: { kind: 'withdraw' },
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
});
