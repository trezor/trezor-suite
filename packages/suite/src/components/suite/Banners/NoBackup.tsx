import React from 'react';
import styled from 'styled-components';

import { Translation } from 'src/components/suite';
import * as routerActions from 'src/actions/suite/routerActions';
import { useActions } from 'src/hooks/suite';
import { Banner } from './Banner';

const Message = styled.span``;

const NoBackup = () => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <Banner
            variant="critical"
            body={
                <Message>
                    <Translation id="TR_YOUR_TREZOR_IS_NOT_BACKED_UP" />{' '}
                    <Translation id="TR_IF_YOUR_DEVICE_IS_EVER_LOST" />
                </Message>
            }
            action={{
                label: <Translation id="TR_CREATE_BACKUP" />,
                onClick: () => goto('backup-index'),
                'data-test': '@notification/no-backup/button',
            }}
        />
    );
};

export default NoBackup;
