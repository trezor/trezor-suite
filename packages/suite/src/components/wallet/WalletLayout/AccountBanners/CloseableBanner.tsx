import { ReactNode } from 'react';

import { Text, Banner, BannerProps, Column, Margin } from '@trezor/components';
import { spacings } from '@trezor/theme/src';

import { Translation } from 'src/components/suite';

interface Props {
    onClose: () => void;
    variant: BannerProps['variant'];
    title: ReactNode;
    children: React.ReactNode;
    hasIcon?: boolean;
    margin?: Margin;
}

export const CloseableBanner = ({
    onClose,
    variant,
    title,
    children,
    hasIcon = false,
    margin,
}: Props) => (
    <Banner
        variant={variant}
        rightContent={
            <Banner.Button onClick={onClose}>
                <Translation id="TR_GOT_IT" />
            </Banner.Button>
        }
        icon={hasIcon ? 'shareNetwork' : undefined}
        margin={margin}
    >
        <Column gap={spacings.xxs} flex="1" alignItems="flex-start" justifyContent="stretch">
            <Text typographyStyle="highlight" variant="info">
                {title}
            </Text>

            {children}
        </Column>
    </Banner>
);
