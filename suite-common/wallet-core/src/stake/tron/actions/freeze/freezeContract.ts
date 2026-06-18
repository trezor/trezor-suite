import { getNetwork } from '@suite-common/wallet-config';
import { type Account, type FormState, type TronResourceType } from '@suite-common/wallet-types';
import { asAmountUnit, unitsToSubunits } from '@suite-common/wallet-utils';
import { tronUtils } from '@trezor/blockchain-link-utils';
import { BigNumber } from '@trezor/utils';

import { tronResourceTypeToCode } from '../../shared/tronResourceCode';

interface BuildFreezeBalanceV2ContractParams {
    ownerHex: string;
    balance: number;
    resourceType: TronResourceType;
}

export const buildFreezeBalanceV2Contract = ({
    ownerHex,
    balance,
    resourceType,
}: BuildFreezeBalanceV2ContractParams) =>
    ({
        type: 'FreezeBalanceV2Contract' as const,
        parameter: {
            value: {
                owner_address: ownerHex,
                balance,
                resource: tronResourceTypeToCode(resourceType),
            },
        },
    }) as const;

export type TronFreezeContract = ReturnType<typeof buildFreezeBalanceV2Contract>;

export const buildFreezeContract = (
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

    return buildFreezeBalanceV2Contract({
        ownerHex,
        balance,
        resourceType,
    });
};

export const buildFreezeReviewForm = (resourceType: TronResourceType): FormState => ({
    outputs: [],
    feePerUnit: '0',
    feeLimit: '',
    options: ['broadcast'],
    tronStaking: { kind: 'freeze', resource: resourceType },
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
});
