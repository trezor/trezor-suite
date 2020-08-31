import React, { useState } from 'react';
import styled from 'styled-components';
import { Modal, Button } from '@trezor/components';
import { Translation } from '@suite-components';
import { useActions } from '@suite-hooks';
import * as metadataActions from '@suite-actions/metadataActions';
import { Deferred } from '@suite-utils/deferred';
import { MetadataProviderType } from '@suite-types/metadata';

const Buttons = styled.div`
    display: flex;
    flex-direction: column;
`;

const StyledButton = styled(Button)`
    margin-top: 10px;
    margin-bottom: 10px;
`;

type Props = {
    onCancel: () => void;
    decision: Deferred<boolean>;
};

const MetadataProvider = (props: Props) => {
    const [isLoading, setIsLoading] = useState('');
    const { connectProvider } = useActions({ connectProvider: metadataActions.connectProvider });

    const onCancel = () => {
        props.decision.resolve(false);
        props.onCancel();
    };

    const connect = async (type: MetadataProviderType) => {
        setIsLoading(type);
        const result = await connectProvider(type);
        if (!result) {
            setIsLoading('');
            // TODO: error state, try again
            return;
        }

        props.decision.resolve(true);
        props.onCancel();
    };

    return (
        <Modal
            cancelable
            onCancel={onCancel}
            size="tiny"
            heading={<Translation id="METADATA_MODAL_HEADING" />}
            description={<Translation id="METADATA_MODAL_DESCRIPTION" />}
            data-test="@modal/metadata-provider"
        >
            <Buttons>
                <StyledButton
                    onClick={() => connect('dropbox')}
                    isLoading={isLoading === 'dropbox'}
                    isDisabled={!!isLoading}
                >
                    <Translation id="TR_DROPBOX" />
                </StyledButton>
                {/* <StyledButton
                    onClick={() => connect('google')}
                    isLoading={isLoading === 'google'}
                    isDisabled={!!isLoading}
                    data-test="@modal/metadata-provider/google-button"
                >
                    <Translation id="TR_GOOGLE_DRIVE" />
                </StyledButton> */}

                {/* <StyledButton
                    variant="secondary"
                    onClick={() => onCancel()}
                    isDisabled={!!isLoading}
                    data-test="@modal/metadata-provider/cancel-button"
                >
                    Continue without saving
                </StyledButton> */}
                {/* TODO: electron only */}
                {/* <StyledButton
                    variant="secondary"
                    onClick={() => connect('userData')}
                    isLoading={isLoading === 'userData'}
                    isDisabled={!!isLoading}
                >
                    Local file system
                </StyledButton> */}
            </Buttons>
        </Modal>
    );
};

export default MetadataProvider;
