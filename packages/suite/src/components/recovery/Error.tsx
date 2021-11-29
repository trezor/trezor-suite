import React from 'react';
import styled from 'styled-components';
import { P } from '@trezor/components';

import { Translation, Image } from '@suite-components';

const StyledImage = styled(Image)`
    flex: 1;
`;

interface Props {
    error?: string;
}

const Error = ({ error }: Props) => (
    <>
        <P size="small">
            <Translation id="TR_RECOVERY_ERROR" values={{ error }} />
        </P>
        <StyledImage image="UNIVERSAL_ERROR" width="160" />
    </>
);

export default Error;
