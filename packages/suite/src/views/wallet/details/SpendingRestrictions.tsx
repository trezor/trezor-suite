import { events, injectDesktopAnalytics } from '@suite/analytics';
import {
    coinjoinAccountUpdateSpendingRestrictions,
    selectCoinjoinSpendingRestrictionByAccountKey,
    selectIsMixingEnabledByAccountKey,
} from '@suite/coinjoin';
import { openModal } from '@suite/modal';
import { Switch } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from 'src/hooks/suite';
import type { Account } from 'src/types/wallet';

type SpendingRestrictionsProps = {
    account: Extract<Account, { backendType: 'coinjoin' }>;
};

export const SpendingRestrictions = ({ account }: SpendingRestrictionsProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const restriction = useSelector(state =>
        selectCoinjoinSpendingRestrictionByAccountKey(state, account.key),
    );
    // Mixed and unmixed coins of a live mixing session must not be combined, so the switch is
    // forced on while a coordinator is configured.
    const isReadOnly = useSelector(state => selectIsMixingEnabledByAccountKey(state, account.key));

    const areRestrictionsEnabled = restriction !== 'unrestricted';

    const handleChange = () => {
        if (areRestrictionsEnabled) {
            // Turning restrictions off weakens a privacy guard, hence the confirmation step.
            dispatch(
                openModal({
                    type: 'coinjoin-disable-spending-restrictions',
                    relatedAccountKey: account.key,
                }),
            );

            return;
        }

        dispatch(coinjoinAccountUpdateSpendingRestrictions(account.key, true));
        analytics.report({
            type: events.accountsActionsEvent.name,
            payload: { symbol: account.symbol, action: 'spending-restrictions-on' },
        });
    };

    return (
        <Switch
            data-testid="@coinjoin/spending-restrictions/toggle-switch"
            isChecked={areRestrictionsEnabled}
            isDisabled={isReadOnly}
            onChange={handleChange}
        />
    );
};
