import styled from 'styled-components';
import { Button, P } from '@trezor/components';
import { Modal, Translation } from 'src/components/suite';
import { UserContextPayload } from 'src/actions/suite/modalActions';

const SmallModal = styled(Modal)`
    width: 560px;
`;

const Description = styled(P)`
    text-align: left;
    margin-bottom: 16px;
`;

const ItalicDescription = styled(Description)`
    font-style: italic;
`;

type DisableTorStopCoinjoinProps = {
    decision: Extract<UserContextPayload, { type: 'disable-tor-stop-coinjoin' }>['decision'];
    onCancel: () => void;
};

export const DisableTorStopCoinjoin = ({ onCancel, decision }: DisableTorStopCoinjoinProps) => {
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
                bottomBar={
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
