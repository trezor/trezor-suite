import React, { useState } from 'react';
import styled from 'styled-components';
import { Modal, P, Button, variables, colors } from '@trezor/components';

import { Translation } from '@suite-components';
import { useActions } from '@suite-hooks';
import * as metadataActions from '@suite-actions/metadataActions';
import { Deferred } from '@suite-utils/deferred';
import { MetadataProviderType } from '@suite-types/metadata';
import { isEnabled } from '@suite-utils/features';

const { FONT_SIZE, FONT_WEIGHT, SCREEN_SIZE } = variables;

const Buttons = styled.div`
    display: flex;
    justify-content: center;
    flex-direction: row;
`;

// todo: can't use button from @trezor/components directly, probably inconsistent design again
// background-color is not even in components color palette
const StyledButton = styled(Button)`
    padding: 10px;
    margin: 0 16px;
    font-size: ${FONT_SIZE.NORMAL};
    background-color: ${colors.NEUE_BG_GRAY};
    font-weight: ${FONT_WEIGHT.DEMI_BOLD};
    height: 42px;

    @media (min-width: ${SCREEN_SIZE.SM}) {
        width: 210px;
    }
`;

// todo: typography shall be unified and these ad hoc styles removed..
const StyledP = styled(P)`
    color: ${colors.BLACK0};
    margin-bottom: 25px;
    font-size: ${FONT_SIZE.SMALL};
    font-weight: ${FONT_WEIGHT.REGULAR};
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
            data-test="@modal/metadata-provider"
        >
            <StyledP>
                <Translation id="METADATA_MODAL_DESCRIPTION" />
            </StyledP>

            <Buttons>
                <StyledButton
                    variant="tertiary"
                    onClick={() => connect('dropbox')}
                    isLoading={isLoading === 'dropbox'}
                    isDisabled={!!isLoading}
                    data-test="@modal/metadata-provider/dropbox-button"
                    icon="DROPBOX"
                >
                    <Translation id="TR_DROPBOX" />
                </StyledButton>
                {isEnabled('GOOGLE_DRIVE_SYNC') && (
                    <StyledButton
                        variant="tertiary"
                        onClick={() => connect('google')}
                        isLoading={isLoading === 'google'}
                        isDisabled={!!isLoading}
                        data-test="@modal/metadata-provider/google-button"
                        icon="GOOGLE_DRIVE"
                    >
                        <Translation id="TR_GOOGLE_DRIVE" />
                    </StyledButton>
                )}
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
