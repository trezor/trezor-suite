import styled from 'styled-components';

import { Button, Paragraph } from '@trezor/components';
import { UserContextPayload } from '@suite-common/suite-types';

import { Modal, Translation } from 'src/components/suite';

const SmallModal = styled(Modal)`
    width: 560px;
`;

const Description = styled(Paragraph)`
    text-align: left;
    margin-bottom: 16px;
`;

const ItalicDescription = styled(Description)`
    font-style: italic;
`;

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
        <>
            <SmallModal
                isCancelable
                onCancel={onKeepRunningTor}
                isHeadingCentered
                heading={<Translation id="TR_TOR_DISABLE" />}
                bottomBarComponents={
                    <>
                        <Button variant="secondary" onClick={onStopRunningTor}>
                            <Translation id="TR_TOR_STOP" />
                        </Button>
                        <Button variant="primary" onClick={onKeepRunningTor}>
                            <Translation id="TR_TOR_KEEP_RUNNING" />
                        </Button>
                    </>
                }
            >
                <>
                    <Description>
                        <Translation
                            id="TR_TOR_REQUEST_ENABLE_FOR_COIN_JOIN_TITLE"
                            values={{
                                b: chunks => <b>{chunks}</b>,
                            }}
                        />
                    </Description>
                    <ItalicDescription>
                        <Translation id="TR_TOR_KEEP_RUNNING_FOR_COIN_JOIN_SUBTITLE" />
                    </ItalicDescription>
                </>
            </SmallModal>
        </>
    );
};
