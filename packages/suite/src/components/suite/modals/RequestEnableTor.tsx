import React from 'react';
import styled from 'styled-components';
import { Button, P } from '@trezor/components';
import { Modal, Translation } from '@suite-components';
import { UserContextPayload } from '@suite-actions/modalActions';

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

type RequestEnableTorProps = Omit<
    Extract<UserContextPayload, { type: 'request-enable-tor' }>,
    'type'
> & {
    onCancel: () => void;
};

export const RequestEnableTor = ({ onCancel, decision, isTorRequired }: RequestEnableTorProps) => {
    const onEnableTor = () => {
        decision.resolve('enable');
        onCancel();
    };

    const onBackClick = () => {
        decision.resolve('cancel');
        onCancel();
    };

    const onSkipClick = () => {
        decision.resolve('skip');
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
                        <Button variant="secondary" onClick={onCancel}>
                            <Translation id="TR_TOR_REQUEST_ENABLE_FOR_COIN_JOIN_LEAVE" />
                        </Button>

                        {!isTorRequired && (
                            <Button variant="secondary" onClick={onSkipClick}>
                                Develop mode. Skip.
                            </Button>
                        )}

                        <Button variant="primary" onClick={onEnableTor}>
                            <Translation id="TR_TOR_ENABLE" />
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
