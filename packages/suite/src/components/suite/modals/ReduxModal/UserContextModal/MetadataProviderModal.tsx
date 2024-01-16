import { useState } from 'react';
import styled from 'styled-components';
import { Paragraph, Button, variables } from '@trezor/components';

import { Translation, Modal } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { connectProvider } from 'src/actions/suite/metadataActions';
import type { Deferred } from '@trezor/utils';
import { MetadataProviderType } from 'src/types/suite/metadata';
import { isFeatureFlagEnabled } from '@suite-common/suite-utils';
import { spacingsPx } from '@trezor/theme';

const { FONT_SIZE, FONT_WEIGHT } = variables;

const Wrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: ${spacingsPx.sm};
`;

const Error = styled.div`
    margin-top: 8px;
    font-size: ${FONT_SIZE.TINY};
    color: ${({ theme }) => theme.TYPE_RED};
`;

// todo: can't use button from @trezor/components directly, probably inconsistent design again
// background-color is not even in components color palette
const StyledButton = styled(Button)`
    padding: 10px;
    font-size: ${FONT_SIZE.NORMAL};
    background-color: ${({ theme }) => theme.BG_GREY};
    font-weight: ${FONT_WEIGHT.DEMI_BOLD};
    height: 42px;
`;

// todo: typography shall be unified and these ad hoc styles removed..
const StyledP = styled(Paragraph)`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    margin-bottom: 25px;
`;

const StyledModal = styled(Modal)`
    width: 600px;
`;

type MetadataProviderModalProps = {
    onCancel: () => void;
    decision: Deferred<boolean>;
};

export const MetadataProviderModal = ({ onCancel, decision }: MetadataProviderModalProps) => {
    const [isLoading, setIsLoading] = useState('');
    // error from authorization popup
    const [error, setError] = useState('');

    const dispatch = useDispatch();

    const onModalCancel = () => {
        decision.resolve(false);
        onCancel();
    };

    const connect = async (type: MetadataProviderType) => {
        setIsLoading(type);
        const result = await dispatch(connectProvider({ type }));
        // window close indicates user action, user knows what happened, no need to show an error message
        if (result === 'window closed') {
            setIsLoading('');
            // stop here, user might have changed his decision and wants to use another provider
            return;
        }
        if (typeof result === 'string') {
            setError(result);
            setIsLoading('');
            return;
        }

        decision.resolve(true);
        onCancel();
    };

    return (
        <StyledModal
            isCancelable
            onCancel={onModalCancel}
            heading={<Translation id="METADATA_MODAL_HEADING" />}
            data-test="@modal/metadata-provider"
            bottomBarComponents={
                <Wrapper>
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

                    {isFeatureFlagEnabled('GOOGLE_DRIVE_SYNC') && (
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

                    {/* desktop only */}
                    {isFeatureFlagEnabled('FILE_SYSTEM_SYNC') && (
                        <StyledButton
                            variant="tertiary"
                            onClick={() => connect('fileSystem')}
                            isLoading={isLoading === 'fileSystem'}
                            isDisabled={!!isLoading}
                            data-test="@modal/metadata-provider/file-system-button"
                        >
                            <Translation id="TR_LOCAL_FILE_SYSTEM" />
                        </StyledButton>
                    )}
                </Wrapper>
            }
        >
            <StyledP type="hint">
                <Translation id="METADATA_MODAL_DESCRIPTION" />
            </StyledP>
            {error && <Error>{error}</Error>}
        </StyledModal>
    );
};
