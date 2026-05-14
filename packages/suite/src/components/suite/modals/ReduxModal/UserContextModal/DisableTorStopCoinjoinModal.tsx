import { Translation } from '@suite/intl';
import { type UserContextPayload } from '@suite-common/suite-types';
import { Banner, Column, Modal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

type DisableTorStopCoinjoinModalProps = {
    decision: Extract<UserContextPayload, { type: 'disable-tor-stop-coinjoin' }>['decision'];
    onCancel: () => void;
};

export const DisableTorStopCoinjoinModal = ({
    onCancel,
    decision,
}: DisableTorStopCoinjoinModalProps) => {
    const onKeepRunningTor = () => {
        decision.resolve(true);
        onCancel();
    };

    const onStopRunningTor = () => {
        decision.resolve(false);
        onCancel();
    };

    return (
        <Modal
            onCancel={onKeepRunningTor}
            heading={<Translation id="TR_TOR_DISABLE" />}
            intent="warning"
            width={600}
            bottomContent={
                <>
                    <Modal.Button onClick={onStopRunningTor}>
                        <Translation id="TR_TOR_STOP" />
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={onKeepRunningTor}>
                        <Translation id="TR_TOR_KEEP_RUNNING" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={spacings.xl}>
                <Banner
                    intent="warning"
                    icon="torBrowser"
                    description={
                        <Paragraph typographyStyle="body-md">
                            <Translation
                                id="TR_TOR_REQUEST_ENABLE_FOR_COIN_JOIN_TITLE"
                                values={{
                                    b: chunks => <strong>{chunks}</strong>,
                                }}
                            />
                        </Paragraph>
                    }
                />
                <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                    <Translation id="TR_TOR_KEEP_RUNNING_FOR_COIN_JOIN_SUBTITLE" />
                </Paragraph>
            </Column>
        </Modal>
    );
};
