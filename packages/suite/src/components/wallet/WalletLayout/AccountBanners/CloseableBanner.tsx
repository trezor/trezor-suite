import { Text, Banner, BannerProps, Column } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { ReactNode } from 'react';
import { spacings } from '@trezor/theme/src';

interface Props {
    onClose: () => void;
    variant: BannerProps['variant'];
    title: ReactNode;
    children: React.ReactNode;
    hasIcon?: boolean;
}

export const CloseableBanner = ({ onClose, variant, title, children, hasIcon = false }: Props) => (
    <Banner
        variant={variant}
        rightContent={
            <Banner.Button onClick={onClose}>
                <Translation id="TR_GOT_IT" />
            </Banner.Button>
        }
        icon={hasIcon ? 'shareNetwork' : undefined}
    >
        <Column gap={spacings.xxs} flex="1" alignItems="flex-start" justifyContent="stretch">
            <Text typographyStyle="highlight" variant="info">
                {title}
            </Text>

            {children}
        </Column>
    </Banner>
);
