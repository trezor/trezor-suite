import React from 'react';
import { Translation } from '@suite-components';
import * as routerActions from '@suite-actions/routerActions';
import { useActions } from '@suite-hooks';
import Wrapper from './components/Wrapper';

const FailedBackup = () => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <Wrapper
            variant="critical"
            body={<Translation id="TR_FAILED_BACKUP" />}
            action={{
                label: <Translation id="TR_CONTINUE" />,
                onClick: () => goto('settings-device'),
                'data-test': '@notification/failed-backup/cta',
            }}
        />
    );
};

export default FailedBackup;
