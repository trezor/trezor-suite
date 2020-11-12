import React from 'react';
import { Button } from '@trezor/components';
import { Translation } from '@suite-components';
import * as routerActions from '@suite-actions/routerActions';
import { useActions } from '@suite-hooks';
import Wrapper from './components/Wrapper';

const FailedBackup = () => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <Wrapper variant="warning">
            <Translation id="TR_FAILED_BACKUP" />
            <Button
                variant="tertiary"
                onClick={() => {
                    goto('settings-device');
                }}
                data-test="@notification/failed-backup/cta"
            >
                <Translation id="TR_CONTINUE" />
            </Button>
        </Wrapper>
    );
};

export default FailedBackup;
