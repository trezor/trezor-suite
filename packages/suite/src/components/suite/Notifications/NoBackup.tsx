import React from 'react';
import { Button } from '@trezor/components';
import { Translation } from '@suite-components';

import Wrapper from './components/Wrapper';
import { Props as BaseProps } from './index';
import styled from 'styled-components';

const Message = styled.span``;
interface Props {
    device: BaseProps['suite']['device'];
    goto: BaseProps['goto'];
}

const NoBackup = ({ device, goto }: Props) => {
    const needsBackup = device?.features?.needs_backup;
    if (!needsBackup) return null;
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
