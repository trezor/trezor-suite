import React from 'react';
import { Button, colors } from '@trezor/components-v2';
import { Translation } from '@suite-components';
import messages from '@suite/support/messages';
import Wrapper from './components/Wrapper';
import { Props as BaseProps } from './index';

interface Props {
    device: BaseProps['suite']['device'];
    goto: BaseProps['goto'];
}

export default ({ device, goto }: Props) => {
    const needsBackup = device && device.features && device.features.needs_backup;
    if (!needsBackup) return null;
    return (
        <Wrapper variant="info">
            <Translation {...messages.TR_YOUR_TREZOR_IS_NOT_BACKED_UP} />{' '}
            <Translation {...messages.TR_IF_YOUR_DEVICE_IS_EVER_LOST} />
            <Button
                variant="tertiary"
                color={colors.WHITE}
                onClick={() => goto('backup-index')}
                data-test="@notification/no-backup/button"
            >
                <Translation {...messages.TR_CREATE_BACKUP} />
            </Button>
        </Wrapper>
    );
};
