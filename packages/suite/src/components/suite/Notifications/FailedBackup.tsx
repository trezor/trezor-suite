import React from 'react';
import { Link } from '@trezor/components';
import { Translation } from '@suite-components';
import messages from '@suite/support/messages';
import { URLS } from '@suite-constants';
import Wrapper from './components/Wrapper';
import { Props as BaseProps } from './index';

interface Props {
    device: BaseProps['suite']['device'];
}

export default ({ device }: Props) => {
    if (!device?.features?.unfinished_backup) return null;
    return (
        <Wrapper variant="info">
            <Translation {...messages.TR_FAILED_BACKUP} />
            <Link variant="nostyle" href={URLS.FAILED_BACKUP_URL}>
                <Translation {...messages.TR_WHAT_TO_DO_NOW} />
            </Link>
        </Wrapper>
    );
};
