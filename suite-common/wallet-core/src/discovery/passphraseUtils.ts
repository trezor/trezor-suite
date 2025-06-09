import { DiscoveryStatus } from '@suite-common/wallet-types';
import { UI } from '@trezor/connect';

/**
 * Determines the current state of the passphrase flow based on discovery status
 * This is used by both web and native implementations to handle passphrase flows consistently
 */
export const determinePassphraseFlowState = (
    discovery: DiscoveryStatus,
    modalState: {
        context?: string;
        modalContextDevice?: string;
        windowType?: string;
    } = {},
) => {
    const isLoading = !(
        (!modalState.modalContextDevice || modalState.context === modalState.modalContextDevice) &&
        modalState.windowType === UI.REQUEST_PASSPHRASE
    );

    const isAddingHiddenWalletWithRespectToSettings =
        discovery.isAddingHiddenWalletWithRespectToSettings === true;

    if (!discovery.isAddingHiddenWallet) {
        return null;
    }

    if (discovery.status === 'progress') {
        return {
            isExisting: discovery.isAddingExistingWallet,
            screen: 'discovery-loader',
            isAddingHiddenWalletWithRespectToSettings,
            discovery,
        } as const;
    }

    if (discovery.status === 'passphrase-enable-on-device') {
        return {
            isExisting: discovery.isAddingExistingWallet,
            screen: 'passphrase-enable-on-device',
            isAddingHiddenWalletWithRespectToSettings,
            discovery,
        } as const;
    }

    if (discovery.isAddingExistingWallet) {
        if (discovery.status === 'enter-passphrase') {
            return {
                isExisting: true,
                screen: 'exists-enter-passphrase',
                isAddingHiddenWalletWithRespectToSettings,
                discovery,
                loading: isLoading,
                isSubmitting: Boolean(discovery.passphraseSubmitted),
            } as const;
        }

        if (discovery.status === 'confirm-empty-passphrase') {
            return {
                isExisting: true,
                screen: 'exists-confirm-passphrase',
                isAddingHiddenWalletWithRespectToSettings,
                discovery,
                loading: isLoading,
            } as const;
        }

        if (discovery.status === 'passphrase-duplicate') {
            return {
                isExisting: true,
                screen: 'passphrase-duplicate',
                discovery,
            } as const;
        }

        if (discovery.status === 'passphrase-mismatch') {
            return {
                isExisting: true,
                screen: 'exists-passphrase-mismatch-warning',
                discovery,
            } as const;
        }
    }

    if (discovery.status === 'enter-passphrase') {
        return {
            isExisting: false,
            screen: 'not-exist-enter-passphrase',
            isAddingHiddenWalletWithRespectToSettings,
            discovery,
            loading: isLoading,
            isSubmitting: Boolean(discovery.passphraseSubmitted),
        } as const;
    }

    if (discovery.status === 'confirm-empty-passphrase') {
        return {
            isExisting: false,
            screen: 'not-exist-confirm-passphrase',
            isAddingHiddenWalletWithRespectToSettings,
            discovery,
            loading: isLoading,
        } as const;
    }

    if (discovery.status === 'passphrase-duplicate') {
        return {
            isExisting: false,
            screen: 'passphrase-duplicate',
            isAddingHiddenWalletWithRespectToSettings,
            discovery,
        } as const;
    }

    if (discovery.status === 'passphrase-mismatch') {
        return {
            isExisting: false,
            screen: 'not-exist-passphrase-mismatch-warning',
            isAddingHiddenWalletWithRespectToSettings,
            discovery,
        } as const;
    }

    return {
        isExisting: false,
        screen: 'not-exist-best-practices',
        isAddingHiddenWalletWithRespectToSettings,
        discovery,
    } as const;
};

/**
 * Type for the return value of determinePassphraseFlowState
 */
export type PassphraseFlowState = ReturnType<typeof determinePassphraseFlowState>;
