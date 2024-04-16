import { HELP_CENTER_RECOVERY_SEED_URL } from '@trezor/urls';

import { openModal } from 'src/actions/suite/modalActions';
import {
    ActionButton,
    ActionColumn,
    SectionItem,
    TextColumn,
    Translation,
} from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

export const MultiShareBackup = () => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(openModal({ type: 'multi-share-backup' }));

    return (
        <SectionItem>
            <TextColumn
                title={<Translation id="TR_MULTI_SHARE_BACKUP" />}
                description={<Translation id="TR_MULTI_SHARE_BACKUP_DESCRIPTION" />}
                buttonLink={HELP_CENTER_RECOVERY_SEED_URL} // TODO: replace link
            />
            <ActionColumn>
                <ActionButton
                    variant="secondary"
                    data-test="@settings/device/create-multi-share-backup-button"
                    onClick={handleClick}
                >
                    <Translation id="TR_CREATE_MULTI_SHARE_BACKUP" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
