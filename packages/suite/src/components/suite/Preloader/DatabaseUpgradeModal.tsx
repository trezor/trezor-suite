import { H3, Modal, Paragraph } from '@trezor/components';

import { Translation } from 'src/components/suite';

type DatabaseUpgradeModalProps = {
    variant: 'blocking' | 'blocked';
};

export const DatabaseUpgradeModal = ({ variant }: DatabaseUpgradeModalProps) => (
    <Modal iconName="database" variant="warning">
        <H3>
            <Translation
                id={
                    variant === 'blocked'
                        ? 'TR_DATABASE_UPGRADE_BLOCKED'
                        : 'TR_THIS_INSTANCE_IS_BLOCKING'
                }
            />
        </H3>
        <Paragraph variant="tertiary">
            <Translation id="TR_RUNNING_MULTIPLE_INSTANCES" />
        </Paragraph>
    </Modal>
);
