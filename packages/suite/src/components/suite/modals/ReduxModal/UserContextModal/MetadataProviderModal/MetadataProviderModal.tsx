import { useState } from 'react';

import { isFeatureFlagEnabled } from '@suite-common/suite-utils';
import { Modal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';
import type { Deferred } from '@trezor/utils';

import { connectProvider } from 'src/actions/suite/metadataProviderActions';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch } from 'src/hooks/suite';
import { MetadataProviderType } from 'src/types/suite/metadata';

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
        <Modal
            onCancel={onModalCancel}
            heading={<Translation id="METADATA_MODAL_HEADING" />}
            data-testid="@modal/metadata-provider"
            bottomContent={
                <>
                    <Modal.Button
                        intent="neutral"
                        priority="secondary"
                        onClick={() => connect('dropbox')}
                        isLoading={isLoading === 'dropbox'}
                        isDisabled={!!isLoading}
                        data-testid="@modal/metadata-provider/dropbox-button"
                        iconLeft="dropboxLogoFilled"
                    >
                        <Translation id="TR_DROPBOX" />
                    </Modal.Button>

                    <Modal.Button
                        intent="neutral"
                        priority="secondary"
                        onClick={() => connect('google')}
                        isLoading={isLoading === 'google'}
                        isDisabled={!!isLoading}
                        data-testid="@modal/metadata-provider/google-button"
                        iconLeft="googleDriveLogoFilled"
                    >
                        <Translation id="TR_GOOGLE_DRIVE" />
                    </Modal.Button>

                    {/* desktop only */}
                    {isFeatureFlagEnabled('FILE_SYSTEM_SYNC') && (
                        <Modal.Button
                            intent="neutral"
                            priority="secondary"
                            onClick={() => connect('fileSystem')}
                            isLoading={isLoading === 'fileSystem'}
                            isDisabled={!!isLoading}
                            data-testid="@modal/metadata-provider/file-system-button"
                        >
                            <Translation id="TR_LOCAL_FILE_SYSTEM" />
                        </Modal.Button>
                    )}
                </>
            }
        >
            <Paragraph typographyStyle="hint">
                <Translation id="METADATA_MODAL_DESCRIPTION" />
            </Paragraph>
            {error && (
                <Paragraph
                    variant="destructive"
                    typographyStyle="label"
                    margin={{ top: spacings.xs }}
                >
                    {error}
                </Paragraph>
            )}
        </Modal>
    );
};
