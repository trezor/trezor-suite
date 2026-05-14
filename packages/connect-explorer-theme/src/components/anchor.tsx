import type { ComponentProps, ReactElement } from 'react';
import { forwardRef } from 'react';

import NextLink from 'next/link';

export type AnchorProps = Omit<ComponentProps<'a'>, 'ref'> & {
    newWindow?: boolean;
};

export const Anchor = forwardRef<HTMLAnchorElement, AnchorProps>(function (
    { href = '', children, newWindow, ...props },
    // ref is used in <NavbarMenu />
    forwardedRef,
): ReactElement {
    if (newWindow) {
        return (
            <a ref={forwardedRef} href={href} target="_blank" rel="noreferrer" {...props}>
                {children}
            </a>
        );
    }

    if (!href) {
        return (
            <a ref={forwardedRef} {...props}>
                {children}
            </a>
        );
    }

    return (
        <NextLink ref={forwardedRef} href={href} {...props}>
            {children}
        </NextLink>
    );
});

Anchor.displayName = 'Anchor';
