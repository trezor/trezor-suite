import React from 'react';

import { P } from '@trezor/components';
import messages from '@suite/support/messages';
import { Translation, UniErrorImg } from '@suite-components';

interface Props {
    error?: string;
}

const Error = ({ error }: Props) => (
    <>
        <P size="small">
            <Translation {...messages.TR_RECOVERY_ERROR} values={{ error }} />
        </P>
        <UniErrorImg />
    </>
);

export default Error;
