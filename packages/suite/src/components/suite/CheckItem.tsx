import { ReactNode } from 'react';

import { Checkbox, Paragraph, Column } from '@trezor/components';

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
    <Checkbox isChecked={isChecked} onClick={onClick} {...rest}>
        <Column alignItems="flex-start">
            <Paragraph>{title}</Paragraph>
            {description && (
                <Paragraph variant="tertiary" typographyStyle="hint">
                    {description}
                </Paragraph>
            )}
            {link && link}
        </Column>
    </Checkbox>
);
