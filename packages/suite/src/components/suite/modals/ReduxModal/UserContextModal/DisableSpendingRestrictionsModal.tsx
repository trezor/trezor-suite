import { useState } from 'react';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { coinjoinAccountUpdateSpendingRestrictions } from '@suite/coinjoin';
import { Translation } from '@suite/intl';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Card, Column, H3, Modal, Paragraph } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { WarningFilledIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { CheckItem } from 'src/components/suite/CheckItem';
import { useSelector } from 'src/hooks/suite';

type DisableSpendingRestrictionsModalProps = {
    relatedAccountKey: AccountKey;
    onCancel: () => void;
};

export const DisableSpendingRestrictionsModal = ({
    relatedAccountKey,
    onCancel,
}: DisableSpendingRestrictionsModalProps) => {
    const [isConfirmed, setIsConfirmed] = useState(false);
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const account = useSelector(state => selectAccountByKey(state, relatedAccountKey));

    const handleDisableRestrictions = () => {
        dispatch(coinjoinAccountUpdateSpendingRestrictions(relatedAccountKey, false));
        if (account) {
            analytics.report({
                type: events.accountsActionsEvent.name,
                payload: { symbol: account.symbol, action: 'spending-restrictions-off' },
            });
        }
        onCancel();
    };

    return (
        <Modal
            onCancel={onCancel}
            icon={WarningFilledIcon}
            width={600}
            intent="warning"
            bottomContent={
                <>
                    <Modal.Button
                        onClick={handleDisableRestrictions}
                        isDisabled={!isConfirmed}
                        data-testid="@coinjoin/spending-restrictions/confirm-off-button"
                    >
                        <Translation id="TR_PRIVACY_ACCOUNT_RESTRICTIONS_OFF_BUTTON" />
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={20}>
                <H3>
                    <Translation id="TR_PRIVACY_ACCOUNT_RESTRICTIONS_OFF_TITLE" />
                </H3>
                <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                    <Translation id="TR_PRIVACY_ACCOUNT_RESTRICTIONS_OFF_DESCRIPTION" />
                </Paragraph>
                <Card>
                    <CheckItem
                        title={<Translation id="TR_PRIVACY_ACCOUNT_RESTRICTIONS_OFF_CHECKBOX" />}
                        isChecked={isConfirmed}
                        onClick={() => setIsConfirmed(!isConfirmed)}
                        data-testid="@coinjoin/spending-restrictions/confirm-off-checkbox"
                    />
                </Card>
            </Column>
        </Modal>
    );
};
