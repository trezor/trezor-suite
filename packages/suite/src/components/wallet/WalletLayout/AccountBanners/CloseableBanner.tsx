import { ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { Banner, BannerProps, Column, Margin, Text } from '@trezor/components';
import { spacings } from '@trezor/theme/src';

interface Props {
    onClose: () => void;
    intent: BannerProps['intent'];
    title: ReactNode;
    children: React.ReactNode;
    hasIcon?: boolean;
    margin?: Margin;
}

export const CloseableBanner = ({
    onClose,
    intent,
    title,
    children,
    hasIcon = false,
    margin,
}: Props) => (
    <Banner
        intent={intent}
        rightContent={
            <Banner.Button onClick={onClose}>
                <Translation id="TR_GOT_IT" />
            </Banner.Button>
        }
        icon={hasIcon ? 'shareNetwork' : undefined}
        margin={margin}
        description={
            <Column gap={spacings.xxs} flex="1" alignItems="flex-start" justifyContent="stretch">
                <Text typographyStyle="highlight" intent="info">
                    {title}
                </Text>

                {children}
            </Column>
        }
    />
);
