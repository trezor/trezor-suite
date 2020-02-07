import React from 'react';

import { P } from '@trezor/components-v2';
import messages from '@suite/support/messages';
import { Translation } from '@suite-components';
import { resolveStaticPath } from '@suite-utils/nextjs';

interface Props {
    error?: string;
}

const Error = ({ error }: Props) => (
    <>
        <P size="small">
            <Translation {...messages.TR_RECOVERY_ERROR} values={{ error }} />
        </P>
        <img alt="" src={resolveStaticPath('images/suite/uni-error.svg')} />
    </>
);

export default Error;
