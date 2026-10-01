import { injectDesktopAnalytics } from '@suite/analytics';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';

import { useYieldDepositContext } from '../../hooks/useYieldDepositContext';

/**
 * Reopens the approve step to modify the allowance, reporting it first. Shared by the approve
 * step's edit action and the deposit step's "Modify approval" button.
 */
export const useModifyApprovalHandler = (): (() => void) => {
    const { analytics } = useServices(injectDesktopAnalytics);
    const { token, vault, enterModifyApproval } = useYieldDepositContext();

    return () => {
        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                type: 'modify-allowance',
                action: 'continue',
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
            },
        });

        enterModifyApproval();
    };
};
