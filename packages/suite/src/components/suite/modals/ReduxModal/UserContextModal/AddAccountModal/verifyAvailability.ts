import { type UnavailableCapability } from '@trezor/connect';

import { type Account } from 'src/types/wallet';

export const verifyAvailability = ({
    emptyAccounts,
    account,
    unavailableCapability,
}: {
    emptyAccounts: Account[];
    account?: Account;
    unavailableCapability?: UnavailableCapability;
}) => {
    if (unavailableCapability === 'no-support') {
        return 'TR_ACCOUNT_TYPE_NO_SUPPORT';
    }
    if (unavailableCapability === 'update-required') {
        return 'TR_ACCOUNT_TYPE_UPDATE_REQUIRED';
    }
    if (unavailableCapability === 'trezor-connect-outdated') {
        return 'FW_CAPABILITY_CONNECT_OUTDATED';
    }
    if (unavailableCapability === 'no-capability') {
        return 'TR_ACCOUNT_TYPE_NO_CAPABILITY';
    }
    if (!account) {
        // discovery failed?
        return 'MODAL_ADD_ACCOUNT_NO_ACCOUNT';
    }

    if (account.networkType !== 'ethereum') {
        if (emptyAccounts.length === 0) {
            return 'MODAL_ADD_ACCOUNT_NO_EMPTY_ACCOUNT';
        }
        if (emptyAccounts.length > 1) {
            // prev account is empty, do not add another
            return 'MODAL_ADD_ACCOUNT_PREVIOUS_EMPTY';
        }
        if (account.index === 0 && account.empty && account.accountType === 'normal') {
            // current (first normal) account is empty, do not add another
            return 'MODAL_ADD_ACCOUNT_PREVIOUS_EMPTY';
        }
    }
};
