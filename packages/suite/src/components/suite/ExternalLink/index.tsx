import React from 'react';
import { Link, LinkProps } from '@trezor/components';

const ExternalLink = ({ children, target = '_blank', ...rest }: LinkProps) => {
    return (
        <Link icon="EXTERNAL_LINK" target={target} {...rest}>
            {children}
        </Link>
    );
};

export default ExternalLink;
