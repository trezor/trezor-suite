import React, { useState } from 'react';
import styled from 'styled-components';
import { Modal, Button } from '@trezor/components';
import { Translation } from '@suite-components';
import { useActions } from '@suite-hooks';
import * as metadataActions from '@suite-actions/metadataActions';
import { Deferred } from '@suite-utils/deferred';
import { MetadataProviderType } from '@suite-types/metadata';
import { resolveStaticPath } from '@suite-utils/nextjs';

const Buttons = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-around;
`;

const StyledButton = styled(Button)`
    padding: 10px;
    flex-basis: 45%;
`;

const StyledImage = styled.img`
    margin: 0 8px 0 0;
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
            size="small"
            heading={<Translation id="METADATA_MODAL_HEADING" />}
            description={<Translation id="METADATA_MODAL_DESCRIPTION" />}
            data-test="@modal/metadata-provider"
        >
            <Buttons>
                <StyledButton
                    variant="tertiary"
                    onClick={() => connect('dropbox')}
                    isLoading={isLoading === 'dropbox'}
                    isDisabled={!!isLoading}
                    data-test="@modal/metadata-provider/dropbox-button"
                >
                    <StyledImage src={resolveStaticPath('images/png/dropbox.png')} />
                    <Translation id="TR_DROPBOX" />
                </StyledButton>
                <StyledButton
                    variant="tertiary"
                    onClick={() => connect('google')}
                    isLoading={isLoading === 'google'}
                    isDisabled={!!isLoading}
                    data-test="@modal/metadata-provider/google-button"
                >
                    <StyledImage src={resolveStaticPath('images/png/google-drive.png')} />

                    <Translation id="TR_GOOGLE_DRIVE" />
                </StyledButton>

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
