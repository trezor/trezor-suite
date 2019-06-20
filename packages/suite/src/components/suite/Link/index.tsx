import React from 'react';
import NextLink, { LinkProps } from 'next/link';
import { routes } from '@suite-utils/router';
import { getPrefixedURL } from '@suite-utils/nextjs';

const Link = ({ children, href, ...rest }: LinkProps) => {
    // if href prop refers to internal url puts assetPrefix in front and
    // pass the prefixed value in 'as' prop to prevent refreshing the page
    const isInternalLink = routes.find(r => r.pattern === href) || false;
    const overrideAsProp = {
        ...(isInternalLink && typeof href === 'string' ? { as: getPrefixedURL(href) } : {}),
    };

    return (
        <NextLink href={href} {...overrideAsProp} {...rest}>
            {children}
        </NextLink>
    );
};

export default Link;
