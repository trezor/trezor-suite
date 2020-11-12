import React from 'react';
import styled from 'styled-components';

import { Button } from '@trezor/components';
import { Translation } from '@suite-components';
import * as routerActions from '@suite-actions/routerActions';
import { useActions } from '@suite-hooks';
import Wrapper from './components/Wrapper';

const Message = styled.span``;

const NoBackup = () => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    return (
        <Wrapper variant="warning">
            <Message>
                <Translation id="TR_YOUR_TREZOR_IS_NOT_BACKED_UP" />{' '}
                <Translation id="TR_IF_YOUR_DEVICE_IS_EVER_LOST" />
            </Message>
            <Button
                variant="tertiary"
                onClick={() => goto('backup-index')}
                data-test="@notification/no-backup/button"
            >
                <Translation id="TR_CREATE_BACKUP" />
            </Button>
        </Wrapper>
    );
};

export default NoBackup;
