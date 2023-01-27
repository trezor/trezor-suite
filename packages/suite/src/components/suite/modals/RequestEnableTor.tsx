import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Button, P } from '@trezor/components';
import { Modal, Translation } from '@suite-components';
import { UserContextPayload } from '@suite-actions/modalActions';
import { isDevEnv } from '@suite-common/suite-utils';
import { useSelector } from '@suite-hooks';
import { selectTorState } from '@suite-reducers/suiteReducer';

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

type RequestEnableTorProps = {
    decision: Extract<UserContextPayload, { type: 'request-enable-tor' }>['decision'];
    onCancel: () => void;
};

export enum RequestEnableTorResponse {
    Continue = 'Continue',
    Back = 'Back',
    Skip = 'Skip',
}

export const RequestEnableTor = ({ onCancel, decision }: RequestEnableTorProps) => {
    const coinjoinAllowNoTor = useSelector(
        state => state.wallet.coinjoin.debug?.coinjoinAllowNoTor,
    );
    const { isTorLoading, isTorEnabled } = useSelector(selectTorState);

    useEffect(() => {
        if (isTorEnabled) {
            decision.resolve(RequestEnableTorResponse.Skip);
            onCancel();
        }
    }, [isTorEnabled, decision, onCancel]);

    const onEnableTor = () => {
        decision.resolve(RequestEnableTorResponse.Continue);
        onCancel();
    };

    const onBackClick = () => {
        decision.resolve(RequestEnableTorResponse.Back);
        onCancel();
    };

    const onSkip = () => {
        decision.resolve(RequestEnableTorResponse.Skip);
        onCancel();
    };

    return (
        <>
            <SmallModal
                isCancelable
                onCancel={onCancel}
                onBackClick={onBackClick}
                isHeadingCentered
                heading={<Translation id="TR_TOR_ENABLE" />}
                bottomBar={
                    <>
                        {(isDevEnv || coinjoinAllowNoTor) && (
                            <Button
                                variant="secondary"
                                onClick={onSkip}
                                data-test="@request-enable-tor-modal/skip-button"
                            >
                                <Translation id="TR_TOR_SKIP" />
                            </Button>
                        )}
                        <Button variant="secondary" onClick={onCancel}>
                            <Translation id="TR_TOR_REQUEST_ENABLE_FOR_COIN_JOIN_LEAVE" />
                        </Button>

                        <Button
                            variant="primary"
                            onClick={onEnableTor}
                            isLoading={isTorLoading}
                            isDisabled={isTorLoading}
                        >
                            {isTorLoading ? (
                                <Translation id="TR_ENABLING_TOR" />
                            ) : (
                                <Translation id="TR_TOR_ENABLE" />
                            )}
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
                        <Translation id="TR_TOR_REQUEST_ENABLE_FOR_COIN_JOIN_SUBTITLE" />
                    </ItalicDescription>
                </>
            </SmallModal>
        </>
    );
};
