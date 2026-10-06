import { useState } from 'react';

import { TrezorLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { Banner, Card, Checkbox, Column, Modal } from '@trezor/components';
import { FileFilledIcon, ShieldWarningFilledIcon } from '@trezor/icons';
import { type Deferred } from '@trezor/utils';

export type TronVoteConsentRepresentative = {
    address: string;
    name: string;
    termsOfServiceUrl: string;
};

interface TronVoteConsentModalProps {
    representatives: TronVoteConsentRepresentative[];
    decision: Deferred<boolean>;
    onCancel: () => void;
}

export const TronVoteConsentModal = ({
    representatives,
    decision,
    onCancel,
}: TronVoteConsentModalProps) => {
    const [isConsentGiven, setIsConsentGiven] = useState(false);

    const representativeName = representatives.map(({ name }) => name).join(', ');

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
                    icon={FileFilledIcon}
                    intent="info"
                    description={
                        <Translation
                            id="TR_TRON_VOTE_CONSENT_MODAL_BANNER_1_TEXT"
                            values={{ representativeName }}
                        />
                    }
                />

                <Banner
                    icon={ShieldWarningFilledIcon}
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
                        <Column gap={4}>
                            {representatives.map(({ address, name, termsOfServiceUrl }) => (
                                <Translation
                                    key={address}
                                    id="TR_TRON_VOTE_CONSENT_MODAL_CONSENT_TEXT"
                                    values={{
                                        representativeName: name,
                                        a: children => (
                                            <TrezorLink href={termsOfServiceUrl}>
                                                {children}
                                            </TrezorLink>
                                        ),
                                    }}
                                />
                            ))}
                        </Column>
                    </Checkbox>
                </Card>
            </Column>
        </Modal>
    );
};
