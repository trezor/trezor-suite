import React from 'react';
import NextLink, { LinkProps } from 'next/link';
import { Link as TLink, LinkProps as TLinkProps } from '@trezor/components-v2';
import { getPrefixedURL, isInternalRoute } from '@suite-utils/router';

type Props = LinkProps & TLinkProps;

const RefLinkComponent = React.forwardRef((props: Props, _ref: any) => (
    <TLink {...props} href={props.href as string} icon="EXTERNAL_LINK">
        {props.children}
    </TLink>
));

const Link = ({ children, href, className, target = '_self', ...rest }: Props) => {
    /*  
        if href prop refers to internal url puts assetPrefix in front and
        pass the prefixed value in 'as' prop to prevent refreshing the page
        TODO: handle UrlObject, Url type of href
    */
    const isInternalLink = typeof href === 'string' ? isInternalRoute(href) : false;
    const overrideAsProp = {
        ...(isInternalLink && typeof href === 'string' ? { as: getPrefixedURL(href) } : {}),
    };

    const { prefetch, shallow, scroll, replace, ...linkProps } = rest;

    const StyledLink = (
        <RefLinkComponent
            href={href as string}
            target={target}
            className={className}
            {...linkProps}
        >
            {children}
        </RefLinkComponent>
    );

    // Next.js Link component should be only used for internal navigation
    // for non-internal href we just return our styled <A>
    // https://github.com/zeit/next.js/blob/master/errors/invalid-href-passed.md
    return isInternalLink ? (
        <NextLink
            href={href}
            prefetch={prefetch}
            scroll={scroll}
            shallow={shallow}
            replace={replace}
            passHref
            {...overrideAsProp}
        >
            {StyledLink}
        </NextLink>
    ) : (
        StyledLink
    );
};

export default Link;
