import { useState } from 'react';

import { TrezorLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import {
    LUGANODES_TERMS_OF_SERVICE_URL,
    P2P_ORG_TERMS_OF_SERVICE_URL,
} from '@suite-common/wallet-core';
import { Banner, Card, Checkbox, Column, Modal } from '@trezor/components';
import { FileFilledIcon, ShieldWarningFilledIcon } from '@trezor/icons';
import { type Deferred } from '@trezor/utils';

interface TronStakeConsentModalProps {
    decision: Deferred<boolean>;
    onCancel: () => void;
}

export const TronStakeConsentModal = ({ decision, onCancel }: TronStakeConsentModalProps) => {
    const [isConsentGiven, setIsConsentGiven] = useState(false);

    const onSubmit = (value: boolean) => {
        decision.resolve(value);
        onCancel();
    };

    const onConfirm = () => onSubmit(true);

    const onDecline = () => onSubmit(false);

    const onConsentToggle = () => {
        setIsConsentGiven(!isConsentGiven);
    };

    return (
        <Modal
            data-testid="@modal/tron-stake-consent"
            heading={<Translation id="TR_EARN_STAKE_TOKEN" values={{ symbol: 'TRX' }} />}
            description={<Translation id="TR_TRON_STAKE_CONSENT_MODAL_DESCRIPTION" />}
            onCancel={onDecline}
            width={600}
            bottomContent={
                <>
                    <Modal.Button
                        isDisabled={!isConsentGiven}
                        onClick={onConfirm}
                        data-testid="@modal/tron-stake-consent/confirm-button"
                    >
                        <Translation id="TR_CONFIRM" />
                    </Modal.Button>

                    <Modal.Button
                        intent="neutral"
                        priority="secondary"
                        onClick={onDecline}
                        data-testid="@modal/tron-stake-consent/cancel-button"
                    >
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={12} margin={{ top: 8, bottom: 20 }}>
                <Banner
                    icon={FileFilledIcon}
                    intent="info"
                    description={<Translation id="TR_TRON_STAKE_CONSENT_MODAL_BANNER_1_TEXT" />}
                />

                <Banner
                    icon={ShieldWarningFilledIcon}
                    intent="info"
                    description={<Translation id="TR_TRON_STAKE_CONSENT_MODAL_BANNER_2_TEXT" />}
                />
            </Column>

            <Column gap={12}>
                <Card>
                    <Checkbox
                        verticalAlignment="center"
                        onChange={onConsentToggle}
                        isChecked={isConsentGiven}
                        data-testid="@modal/tron-stake-consent/checkbox"
                    >
                        <Translation
                            id="TR_TRON_STAKE_CONSENT_MODAL_CONSENT_TEXT"
                            values={{
                                p2p: children => (
                                    <TrezorLink href={P2P_ORG_TERMS_OF_SERVICE_URL}>
                                        {children}
                                    </TrezorLink>
                                ),
                                luganodes: children => (
                                    <TrezorLink href={LUGANODES_TERMS_OF_SERVICE_URL}>
                                        {children}
                                    </TrezorLink>
                                ),
                            }}
                        />
                    </Checkbox>
                </Card>
            </Column>
        </Modal>
    );
};
