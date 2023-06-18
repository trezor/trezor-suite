import React from 'react';
import { Translation } from 'src/components/suite';
import * as routerActions from 'src/actions/suite/routerActions';
import { useActions } from 'src/hooks/suite';
import { Banner } from './Banner';
import { SettingsAnchor } from 'src/constants/suite/anchors';

const FailedBackup = () => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <Banner
            variant="critical"
            body={<Translation id="TR_FAILED_BACKUP" />}
            action={{
                label: <Translation id="TR_CONTINUE" />,
                onClick: () => goto('settings-device', { anchor: SettingsAnchor.BackupFailed }),
                'data-test': '@notification/failed-backup/cta',
            }}
        />
    );
};

export default FailedBackup;
