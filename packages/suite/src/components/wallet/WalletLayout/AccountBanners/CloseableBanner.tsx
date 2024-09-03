import { H3, Divider, Banner, BannerProps, Column } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { ReactNode } from 'react';
import { spacings } from '@trezor/theme/src';

interface Props {
    onClose: () => void;
    variant: BannerProps['variant'];
    title: ReactNode;
    children: React.ReactNode;
}

export const CloseableBanner = ({ onClose, variant, title, children }: Props) => (
    <Banner
        variant={variant}
        rightContent={
            <Banner.Button onClick={onClose}>
                <Translation id="TR_GOT_IT" />
            </Banner.Button>
        }
    >
        <Column flex="1" alignItems="flex-start">
            <H3>{title}</H3>
            <Divider margin={{ top: spacings.xs, bottom: spacings.md }} />
            {children}
        </Column>
    </Banner>
);
