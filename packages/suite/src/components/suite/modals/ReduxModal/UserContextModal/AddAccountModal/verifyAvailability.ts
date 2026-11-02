import { type UnavailableCapability } from '@trezor/connect';

import { type Account } from 'src/types/wallet';

type VerifyAvailabilityParams = {
    // Accounts of one device, network and account type, sorted by index.
    scopedAccounts: Account[];
    unavailableCapability?: UnavailableCapability;
};

export const verifyAvailability = ({
    scopedAccounts,
    unavailableCapability,
}: VerifyAvailabilityParams) => {
    const [lastAccount, ...prevAccounts] = scopedAccounts.toReversed();

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
    if (!lastAccount) {
        // discovery failed?
        return 'MODAL_ADD_ACCOUNT_NO_ACCOUNT';
    }

    if (lastAccount.networkType === 'ethereum') {
        return;
    }

    if (prevAccounts.some(a => a.empty)) {
        // prev account is empty, do not add another
        return 'MODAL_ADD_ACCOUNT_PREVIOUS_EMPTY';
    }
    if (!lastAccount.empty || lastAccount.visible) {
        return 'MODAL_ADD_ACCOUNT_NO_EMPTY_ACCOUNT';
    }
};
