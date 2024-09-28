import { ReactNode } from 'react';

import { Button, ButtonProps } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { Url } from '@trezor/urls';
import { useExternalLink } from '../../hooks/suite';

interface LearnMoreButtonProps extends Omit<ButtonProps, 'children'> {
    url: Url;
    children?: ReactNode;
    textWrap?: boolean;
}

export const LearnMoreButton = ({
    children,
    className,
    size = 'tiny',
    url,
    textWrap,
    ...buttonProps
}: LearnMoreButtonProps) => (
    <Button
        href={useExternalLink(url)}
        textWrap={textWrap}
        variant="tertiary"
        size={size}
        icon="externalLink"
        iconAlignment="right"
        className={className}
        {...buttonProps}
    >
        {children || <Translation id="TR_LEARN_MORE" />}
    </Button>
);
