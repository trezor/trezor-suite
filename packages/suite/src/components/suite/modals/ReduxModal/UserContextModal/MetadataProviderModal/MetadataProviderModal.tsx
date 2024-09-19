import { useState } from 'react';
import { Button, NewModal, Row, Paragraph } from '@trezor/components';

import { Translation } from 'src/components/suite/index';
import { useDispatch } from 'src/hooks/suite';
import { connectProvider } from 'src/actions/suite/metadataProviderActions';
import type { Deferred } from '@trezor/utils';
import { MetadataProviderType } from 'src/types/suite/metadata';
import { isFeatureFlagEnabled } from '@suite-common/suite-utils';
import { spacings } from '@trezor/theme';
import { DropboxLogo } from './DropboxLogo';
import { GoogleDriveLogo } from './GoogleDriveLogo';

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
        <NewModal
            onCancel={onModalCancel}
            heading={<Translation id="METADATA_MODAL_HEADING" />}
            data-testid="@modal/metadata-provider"
            bottomContent={
                <Row gap={spacings.sm} flexWrap="wrap">
                    <Button
                        variant="tertiary"
                        onClick={() => connect('dropbox')}
                        isLoading={isLoading === 'dropbox'}
                        isDisabled={!!isLoading}
                        data-testid="@modal/metadata-provider/dropbox-button"
                        icon={<DropboxLogo size={20} />}
                        textWrap={false}
                    >
                        <Translation id="TR_DROPBOX" />
                    </Button>

                    {isFeatureFlagEnabled('GOOGLE_DRIVE_SYNC') && (
                        <Button
                            variant="tertiary"
                            onClick={() => connect('google')}
                            isLoading={isLoading === 'google'}
                            isDisabled={!!isLoading}
                            data-testid="@modal/metadata-provider/google-button"
                            icon={<GoogleDriveLogo size={20} />}
                        >
                            <Translation id="TR_GOOGLE_DRIVE" />
                        </Button>
                    )}

                    {/* desktop only */}
                    {isFeatureFlagEnabled('FILE_SYSTEM_SYNC') && (
                        <Button
                            variant="tertiary"
                            onClick={() => connect('fileSystem')}
                            isLoading={isLoading === 'fileSystem'}
                            isDisabled={!!isLoading}
                            data-testid="@modal/metadata-provider/file-system-button"
                        >
                            <Translation id="TR_LOCAL_FILE_SYSTEM" />
                        </Button>
                    )}
                </Row>
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
        </NewModal>
    );
};
