import React from 'react';
import { TrezorLink } from '@suite-components';
import { LinkProps } from '@trezor/components';

const ExternalLink = ({ children, target = '_blank', ...rest }: LinkProps) => (
    <TrezorLink icon="EXTERNAL_LINK" target={target} {...rest}>
        {children}
    </TrezorLink>
);

export default ExternalLink;
