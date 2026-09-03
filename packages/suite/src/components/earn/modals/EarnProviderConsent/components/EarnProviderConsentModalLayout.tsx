import { type ReactNode, useMemo, useState } from 'react';

import { Translation } from '@suite/intl';
import { selectVotingDelegationOption, validateCardanoDrep } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Card, Checkbox, Column, Modal } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

interface EarnProviderConsentModalLayoutProps {
    heading: ReactNode;
    description?: ReactNode;
    banners: ReactNode;
    consentText: ReactNode;
    onConfirm: () => void;
    onCancel: () => void;
    account: Account;
    children?: ReactNode;
}

export const EarnProviderConsentModalLayout = ({
    heading,
    description,
    banners,
    consentText,
    onConfirm,
    onCancel,
    account,
    children,
}: EarnProviderConsentModalLayoutProps) => {
    const [hasAgreed, setHasAgreed] = useState(false);
    const selectedVotingDelegation = useSelector(state =>
        selectVotingDelegationOption(state, account.key),
    );
    const isCardanoNetworkType = account.networkType === 'cardano';

    const isDrepValid = useMemo(() => {
        if (!isCardanoNetworkType || selectedVotingDelegation.type !== 'another_drep') {
            return true;
        }

        return validateCardanoDrep(selectedVotingDelegation.drepId);
    }, [selectedVotingDelegation, isCardanoNetworkType]);

    return (
        <Modal
            data-testid="@modal/earn-provider-consent"
            heading={heading}
            description={description}
            onCancel={onCancel}
            width={600}
            bottomContent={
                <>
                    <Modal.Button
                        isDisabled={!hasAgreed || !isDrepValid}
                        onClick={onConfirm}
                        data-testid="@modal/staking/confirm-button"
                    >
                        <Translation id="TR_CONFIRM" />
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={12} margin={{ top: 8, bottom: 20 }}>
                {banners}
            </Column>
            <Column gap={12}>
                {children}
                <Card>
                    <Checkbox
                        data-testid="@staking/provider-acknowledge-checkbox"
                        verticalAlignment="center"
                        onChange={() => setHasAgreed(!hasAgreed)}
                        isChecked={hasAgreed}
                    >
                        {consentText}
                    </Checkbox>
                </Card>
            </Column>
        </Modal>
    );
};
