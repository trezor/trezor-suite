import React from 'react';
import { Translation } from 'src/components/suite';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';
import { Banner } from './Banner';
import { SettingsAnchor } from 'src/constants/suite/anchors';

const FailedBackup = () => {
    const dispatch = useDispatch();

    const action = {
        label: <Translation id="TR_CONTINUE" />,
        onClick: () => dispatch(goto('settings-device', { anchor: SettingsAnchor.BackupFailed })),
        'data-test': '@notification/failed-backup/cta',
    };

    return (
        <Banner variant="critical" body={<Translation id="TR_FAILED_BACKUP" />} action={action} />
    );
};

export default FailedBackup;
