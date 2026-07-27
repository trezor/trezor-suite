import { Translation } from '@suite/intl';
import { H3, Modal, Paragraph } from '@trezor/components';
import { DatabaseIcon } from '@trezor/icons';

type DatabaseUpgradeModalProps = {
    variant: 'blocking' | 'blocked';
};

export const DatabaseUpgradeModal = ({ variant }: DatabaseUpgradeModalProps) => (
    <Modal icon={DatabaseIcon} intent="warning">
        <H3>
            <Translation
                id={
                    variant === 'blocked'
                        ? 'TR_DATABASE_UPGRADE_BLOCKED'
                        : 'TR_THIS_INSTANCE_IS_BLOCKING'
                }
            />
        </H3>
        <Paragraph intent="neutral" priority="secondary">
            <Translation id="TR_RUNNING_MULTIPLE_INSTANCES" />
        </Paragraph>
    </Modal>
);
