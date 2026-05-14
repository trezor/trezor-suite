import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { type MetadataProviderType } from '@suite-common/metadata-types';
import { isFeatureFlagEnabled } from '@suite-common/suite-utils';
import { Banner, Column, H3, Modal, Paragraph } from '@trezor/components';

type MetadataProviderSelectionModalProps = {
    onCancel: () => void;
    onSelect: (providerType: MetadataProviderType) => void;
    loadingProvider?: MetadataProviderType | '';
    isDisabled?: boolean;
    error?: ReactNode | '';
    heading?: ReactNode;
    description?: ReactNode;
    testId?: string;
};

export const MetadataProviderSelectionModal = ({
    onCancel,
    onSelect,
    loadingProvider = '',
    isDisabled = false,
    error = '',
    heading,
    description,
    testId = '@modal/metadata-provider',
}: MetadataProviderSelectionModalProps) => (
    <Modal
        onCancel={onCancel}
        data-testid={testId}
        width={600}
        iconName="tag"
        bottomContent={
            <>
                <Modal.Button
                    intent="neutral"
                    priority="secondary"
                    onClick={() => onSelect('dropbox')}
                    isLoading={loadingProvider === 'dropbox'}
                    isDisabled={isDisabled || !!loadingProvider}
                    data-testid={`${testId}/dropbox-button`}
                    iconLeft="dropboxLogoFilled"
                >
                    <Translation id="TR_DROPBOX" />
                </Modal.Button>

                <Modal.Button
                    intent="neutral"
                    priority="secondary"
                    onClick={() => onSelect('google')}
                    isLoading={loadingProvider === 'google'}
                    isDisabled={isDisabled || !!loadingProvider}
                    data-testid={`${testId}/google-button`}
                    iconLeft="googleDriveLogoFilled"
                >
                    <Translation id="TR_GOOGLE_DRIVE" />
                </Modal.Button>

                {/* desktop only */}
                {isFeatureFlagEnabled('FILE_SYSTEM_SYNC') && (
                    <Modal.Button
                        intent="neutral"
                        priority="secondary"
                        onClick={() => onSelect('fileSystem')}
                        isLoading={loadingProvider === 'fileSystem'}
                        isDisabled={isDisabled || !!loadingProvider}
                        data-testid={`${testId}/file-system-button`}
                    >
                        <Translation id="TR_LOCAL_FILE_SYSTEM" />
                    </Modal.Button>
                )}
            </>
        }
    >
        <Column gap={4}>
            <H3>{heading ?? <Translation id="METADATA_MODAL_HEADING" />}</H3>
            <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                {description ?? <Translation id="METADATA_MODAL_DESCRIPTION" />}
            </Paragraph>
            {error && <Banner intent="critical" icon description={error} />}
        </Column>
    </Modal>
);
