import { getNetwork } from '@suite-common/wallet-config';
import { type Account, type FormState } from '@suite-common/wallet-types';
import { asAmountUnit, unitsToSubunits } from '@suite-common/wallet-utils';
import { tronUtils } from '@trezor/blockchain-link-utils';
import { BigNumber } from '@trezor/utils';

import { tronResourceTypeToCode } from '../../shared/tronResourceCode';
import { type TronResourceType } from '../../tronStakeTypes';

interface BuildUnfreezeBalanceV2ContractParams {
    ownerHex: string;
    balance: number;
    resourceType: TronResourceType;
}

export const buildUnfreezeBalanceV2Contract = ({
    ownerHex,
    balance,
    resourceType,
}: BuildUnfreezeBalanceV2ContractParams) =>
    ({
        type: 'UnfreezeBalanceV2Contract' as const,
        parameter: {
            value: {
                owner_address: ownerHex,
                balance,
                resource: tronResourceTypeToCode(resourceType),
            },
        },
    }) as const;

export type TronUnstakeContract = ReturnType<typeof buildUnfreezeBalanceV2Contract>;

export const buildUnstakeContract = (
    account: Account,
    amount: string,
    resourceType: TronResourceType,
) => {
    const ownerHex = tronUtils.tronAddressToHex(account.descriptor);

    if (!ownerHex) {
        return null;
    }

    const balance = unitsToSubunits({
        value: asAmountUnit(new BigNumber(amount)),
        decimals: getNetwork(account.symbol).decimals,
    }).toNumber();

    return buildUnfreezeBalanceV2Contract({
        ownerHex,
        balance,
        resourceType,
    });
};

export const buildUnstakeReviewForm = (resourceType: TronResourceType): FormState => ({
    outputs: [],
    feePerUnit: '0',
    feeLimit: '',
    options: ['broadcast'],
    tronStaking: { kind: 'unstake', resource: resourceType },
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
});
