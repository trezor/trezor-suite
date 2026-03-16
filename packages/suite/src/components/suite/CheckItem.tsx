import { type JSX, type ReactNode } from 'react';

import { Checkbox, Column, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

interface CheckItemProps {
    title: ReactNode;
    description?: ReactNode;
    isChecked: boolean;
    link?: JSX.Element;
    onClick: () => void;
}

export const CheckItem = ({
    title,
    description,
    isChecked,
    link,
    onClick,
    ...rest
}: CheckItemProps) => (
    <Checkbox isChecked={isChecked} onChange={onClick} {...rest}>
        <Column alignItems="flex-start" gap={spacings.xs}>
            <Paragraph>{title}</Paragraph>
            {description && (
                <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                    {description}
                </Paragraph>
            )}
            {link && link}
        </Column>
    </Checkbox>
);
