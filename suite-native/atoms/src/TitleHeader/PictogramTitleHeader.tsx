import { ReactNode } from 'react';

import { IconName } from '@suite-common/icons';
import { TypographyStyle } from '@trezor/theme';

import { VStack } from '../Stack';
import { PictogramVariant, PictogramSize, Pictogram } from '../Pictogram';
import { CenteredTitleHeader } from './CenteredTitleHeader';

type PictogramTitleHeaderProps = {
    variant: PictogramVariant;
    icon: IconName;
    size?: PictogramSize;
    title?: ReactNode;
    titleVariant?: TypographyStyle;
    subtitle?: ReactNode;
};

export const PictogramTitleHeader = ({
    variant,
    icon,
    title,
    subtitle,
    titleVariant = 'titleSmall',
    size = 'large',
}: PictogramTitleHeaderProps) => {
    return (
        <VStack alignItems="center" spacing="large">
            <Pictogram variant={variant} icon={icon} size={size} />
            <CenteredTitleHeader title={title} subtitle={subtitle} titleVariant={titleVariant} />
        </VStack>
    );
};
