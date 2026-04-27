import type { ComponentProps } from 'react';

import { useRouter } from 'next/router';

import { Button } from '@trezor/components';

type LinkButtonProps = Omit<ComponentProps<typeof Button>, 'target'> & {
    href: string;
};

const isExternal = (href: string) => /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//');

export const LinkButton = ({ href, children, onClick, ...props }: LinkButtonProps) => {
    const router = useRouter();
    const external = isExternal(href);
    const resolvedHref = external ? href : `${router.basePath}${href}`;

    return (
        <Button
            {...props}
            href={resolvedHref}
            target="_self"
            onClick={e => {
                onClick?.(e);
                if (e.defaultPrevented) return;
                if (external) return;
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                void router.push(href);
            }}
        >
            {children}
        </Button>
    );
};
