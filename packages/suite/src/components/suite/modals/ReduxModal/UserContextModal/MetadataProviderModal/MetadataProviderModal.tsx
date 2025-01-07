import { useState } from 'react';

import { Button, NewModal, Row, Paragraph } from '@trezor/components';
import type { Deferred } from '@trezor/utils';
import { isFeatureFlagEnabled } from '@suite-common/suite-utils';
import { spacings } from '@trezor/theme';
import { Metadata } from '@trezor/metadata';
import { Translation } from 'src/components/suite/index';
import { useDispatch } from 'src/hooks/suite';
import { connectProvider } from 'src/actions/suite/metadataProviderActions';
import { getOrInitProvider } from 'src/actions/suite/metadataLabelingActions';
import { DataType, MetadataProviderType } from 'src/types/suite/metadata';
import * as METADATA_PROVIDER from 'src/actions/suite/constants/metadataProviderConstants';
import { DropboxLogo } from './DropboxLogo';
import { GoogleDriveLogo } from './GoogleDriveLogo';

// todo: maybe I should follow a rule that logic should only be called through actions from a component
const metadataClient = Metadata.getSingleton();

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

    const connect = async (
        type: MetadataProviderType,
        {
            dataType,
            clientId,
        }: {
            dataType?: DataType;
            clientId: string;
        },
    ) => {
        setIsLoading(type);

        const result = await dispatch(getOrInitProvider({ clientId, type }));

        console.log('component: result', result);
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
                        onClick={() =>
                            connect('dropbox', {
                                clientId: METADATA_PROVIDER.DROPBOX_CLIENT_ID,
                                dataType: 'labels',
                            })
                        }
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
                            onClick={() =>
                                connect('google', {
                                    // todo: really? there are 2 id's depending on situation maybe I shouldn't be using
                                    // some artificial clientId
                                    clientId: METADATA_PROVIDER.GOOGLE_CODE_FLOW_CLIENT_ID,
                                    dataType: 'labels',
                                })
                            }
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
                            onClick={() =>
                                connect('fileSystem', {
                                    clientId: 'fileSystem',
                                    dataType: 'labels',
                                })
                            }
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
