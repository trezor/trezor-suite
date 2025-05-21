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
    if (!discovery.isAddingHiddenWallet) {
        return null;
    }

    if (discovery.status === 'progress') {
        return {
            isExisting: discovery.isAddingExistingWallet,
            screen: 'discovery-loader',
            discovery,
        } as const;
    }

    if (discovery.status === 'passphrase-enable-on-device') {
        return {
            isExisting: discovery.isAddingExistingWallet,
            screen: 'passphrase-enable-on-device',
            discovery,
        } as const;
    }

    if (discovery.isAddingExistingWallet) {
        if (discovery.status === 'enter-passphrase') {
            return {
                isExisting: true,
                screen: 'exists-enter-passphrase',
                discovery,
                loading: !(
                    (!modalState.modalContextDevice ||
                        modalState.context === modalState.modalContextDevice) &&
                    modalState.windowType === UI.REQUEST_PASSPHRASE
                ),
            } as const;
        }

        if (discovery.status === 'confirm-empty-passphrase') {
            return {
                isExisting: true,
                screen: 'exists-confirm-passphrase',
                discovery,
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
            discovery,
            loading: !(
                modalState.context === modalState.modalContextDevice &&
                modalState.windowType === UI.REQUEST_PASSPHRASE
            ),
        } as const;
    }

    if (discovery.status === 'confirm-empty-passphrase') {
        return {
            isExisting: false,
            screen: 'not-exist-confirm-passphrase',
            discovery,
        } as const;
    }

    if (discovery.status === 'passphrase-duplicate') {
        return {
            isExisting: false,
            screen: 'passphrase-duplicate',
            discovery,
        } as const;
    }

    if (discovery.status === 'passphrase-mismatch') {
        return {
            isExisting: false,
            screen: 'not-exist-passphrase-mismatch-warning',
            discovery,
        } as const;
    }

    return {
        isExisting: false,
        screen: 'not-exist-best-practices',
        discovery,
    } as const;
};

/**
 * Type for the return value of determinePassphraseFlowState
 */
export type PassphraseFlowState = ReturnType<typeof determinePassphraseFlowState>;
