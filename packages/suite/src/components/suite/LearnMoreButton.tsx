import { ReactNode } from 'react';

import { Button, ButtonProps } from '@trezor/components';
import { Url } from '@trezor/urls';

import { Translation } from 'src/components/suite/Translation';

import { useExternalLink } from '../../hooks/suite';

interface LearnMoreButtonProps extends Omit<ButtonProps, 'children'> {
    url: Url;
    children?: ReactNode;
}

export const LearnMoreButton = ({
    children,
    size = 'small',
    url,
    ...buttonProps
}: LearnMoreButtonProps) => (
    <Button
        href={useExternalLink(url)}
        intent="neutral"
        priority="secondary"
        size={size}
        {...buttonProps}
    >
        {children || <Translation id="TR_LEARN_MORE" />}
    </Button>
);
