import { H3, Divider, Warning, WarningProps, Column } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { ReactNode } from 'react';
import { spacings } from '@trezor/theme/src';

interface Props {
    onClose: () => void;
    variant: WarningProps['variant'];
    title: ReactNode;
    children: React.ReactNode;
}

export const CloseableBanner = ({ onClose, variant, title, children }: Props) => (
    <Warning
        variant={variant}
        rightContent={
            <Warning.Button onClick={onClose}>
                <Translation id="TR_GOT_IT" />
            </Warning.Button>
        }
    >
        <Column flex={1} alignItems="flex-start">
            <H3>{title}</H3>
            <Divider margin={{ top: spacings.xs, bottom: spacings.md }} />
            {children}
        </Column>
    </Warning>
);
