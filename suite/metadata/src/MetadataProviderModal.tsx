import { useState } from 'react';
import { useDispatch } from 'react-redux';

import { Translation } from '@suite/intl';
import { type MetadataProviderType } from '@suite-common/metadata-types';
import { isFeatureFlagEnabled } from '@suite-common/suite-utils';
import { Banner, Column, H3, Modal, Paragraph } from '@trezor/components';
import type { Deferred } from '@trezor/utils';

import { connectProvider } from './metadataProviderThunks';

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
            data-testid="@modal/metadata-provider"
            width={600}
            iconName="tag"
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
            <Column gap={4}>
                <H3>
                    <Translation id="METADATA_MODAL_HEADING" />
                </H3>
                <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id="METADATA_MODAL_DESCRIPTION" />
                </Paragraph>
                {error && <Banner intent="critical" icon description={error} />}
            </Column>
        </Modal>
    );
};
