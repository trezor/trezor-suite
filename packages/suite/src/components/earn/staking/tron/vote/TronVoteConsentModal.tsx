import { useState } from 'react';

import { TrezorLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { Banner, Card, Checkbox, Column, Modal } from '@trezor/components';
import { type Deferred } from '@trezor/utils';

interface TronVoteConsentModalProps {
    representativeName: string;
    termsOfServiceUrl: string;
    decision: Deferred<boolean>;
    onCancel: () => void;
}

export const TronVoteConsentModal = ({
    representativeName,
    termsOfServiceUrl,
    decision,
    onCancel,
}: TronVoteConsentModalProps) => {
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
            heading={
                <Translation
                    id="TR_TRON_VOTE_CONSENT_MODAL_HEADING"
                    values={{ representativeName }}
                />
            }
            description={<Translation id="TR_TRON_VOTE_CONSENT_MODAL_DESCRIPTION" />}
            onCancel={onDecline}
            width={600}
            bottomContent={
                <>
                    <Modal.Button isDisabled={!isConsentGiven} onClick={onConfirm}>
                        <Translation id="TR_CONFIRM" />
                    </Modal.Button>

                    <Modal.Button intent="neutral" priority="secondary" onClick={onDecline}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={12} margin={{ top: 8, bottom: 20 }}>
                <Banner
                    icon="fileFilled"
                    intent="info"
                    description={
                        <Translation
                            id="TR_TRON_VOTE_CONSENT_MODAL_BANNER_1_TEXT"
                            values={{ representativeName }}
                        />
                    }
                />

                <Banner
                    icon="shieldWarningFilled"
                    intent="info"
                    description={
                        <Translation
                            id="TR_TRON_VOTE_CONSENT_MODAL_BANNER_2_TEXT"
                            values={{ representativeName }}
                        />
                    }
                />
            </Column>

            <Column gap={12}>
                <Card>
                    <Checkbox
                        verticalAlignment="center"
                        onChange={onConsentToggle}
                        isChecked={isConsentGiven}
                    >
                        <Translation
                            id="TR_TRON_VOTE_CONSENT_MODAL_CONSENT_TEXT"
                            values={{
                                representativeName,
                                a: children =>
                                    termsOfServiceUrl ? (
                                        <TrezorLink href={termsOfServiceUrl}>{children}</TrezorLink>
                                    ) : (
                                        children
                                    ),
                            }}
                        />
                    </Checkbox>
                </Card>
            </Column>
        </Modal>
    );
};
