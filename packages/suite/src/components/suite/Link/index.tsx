import React from 'react';
import NextLink, { LinkProps } from 'next/link';
import { Link as TLink } from '@trezor/components';
import { routes } from '@suite-utils/router';
import { getPrefixedURL } from '@suite-utils/nextjs';

interface Props extends LinkProps {
    className?: string;
}

const Link = ({ children, href, className, ...rest }: Props) => {
    // if href prop refers to internal url puts assetPrefix in front and
    // pass the prefixed value in 'as' prop to prevent refreshing the page
    const isInternalLink = routes.find(r => r.pattern === href) || false;
    const overrideAsProp = {
        ...(isInternalLink && typeof href === 'string' ? { as: getPrefixedURL(href) } : {}),
    };

    return (
        <NextLink href={href} passHref {...overrideAsProp} {...rest}>
            <TLink target="_self" {...rest} className={className}>
                {children}
            </TLink>
        </NextLink>
    );
};

export default Link;
