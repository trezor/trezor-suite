import { UserContextPayload } from '@suite-common/suite-types';
import { Banner, Column, NewModal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';

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
        <NewModal
            onCancel={onKeepRunningTor}
            heading={<Translation id="TR_TOR_DISABLE" />}
            variant="warning"
            size="small"
            bottomContent={
                <>
                    <NewModal.Button onClick={onStopRunningTor}>
                        <Translation id="TR_TOR_STOP" />
                    </NewModal.Button>
                    <NewModal.Button variant="tertiary" onClick={onKeepRunningTor}>
                        <Translation id="TR_TOR_KEEP_RUNNING" />
                    </NewModal.Button>
                </>
            }
        >
            <Column gap={spacings.xl}>
                <Banner variant="warning" icon="torBrowser" iconSize="large">
                    <Paragraph typographyStyle="body">
                        <Translation
                            id="TR_TOR_REQUEST_ENABLE_FOR_COIN_JOIN_TITLE"
                            values={{
                                b: chunks => <strong>{chunks}</strong>,
                            }}
                        />
                    </Paragraph>
                </Banner>
                <Paragraph variant="tertiary" typographyStyle="hint">
                    <Translation id="TR_TOR_KEEP_RUNNING_FOR_COIN_JOIN_SUBTITLE" />
                </Paragraph>
            </Column>
        </NewModal>
    );
};
