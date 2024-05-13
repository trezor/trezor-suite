import { HELP_CENTER_SEED_CARD_URL } from '@trezor/urls';
import {
    ActionButton,
    ActionColumn,
    SectionItem,
    TextColumn,
    Translation,
} from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectDevice } from '@suite-common/wallet-core';
import { TrezorDevice } from '@suite-common/suite-types';
import { goto } from '../../../actions/suite/routerActions';

const doesSupportMultiShare = (device: TrezorDevice | undefined): boolean => {
    if (device?.features === undefined) {
        return false;
    }

    if (!device.features.capabilities?.includes('Capability_Shamir')) {
        return false;
    }

    return (
        device.features.backup_type !== null &&
        [
            'Slip39_Single_Extendable',
            'Slip39_Basic_Extendable',
            'Slip39_Advanced_Extendable',
        ].includes(device.features.backup_type)
    );
};

export const MultiShareBackup = () => {
    const device = useSelector(selectDevice);
    const dispatch = useDispatch();

    if (!doesSupportMultiShare(device)) {
        return;
    }

    const handleClick = () => dispatch(goto('create-multi-share-backup'));

    return (
        <SectionItem>
            <TextColumn
                title={<Translation id="TR_MULTI_SHARE_BACKUP" />}
                description={<Translation id="TR_MULTI_SHARE_BACKUP_DESCRIPTION" />}
                buttonLink={HELP_CENTER_SEED_CARD_URL}
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
