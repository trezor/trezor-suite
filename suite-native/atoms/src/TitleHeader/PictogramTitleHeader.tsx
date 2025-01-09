import { ReactNode } from 'react';

import { IconName } from '@suite-native/icons';
import { TypographyStyle } from '@trezor/theme';

import { VStack } from '../Stack';
import { PictogramVariant, Pictogram } from '../Pictogram/Pictogram';
import { CenteredTitleHeader } from './CenteredTitleHeader';

type PictogramTitleHeaderProps = {
    variant: PictogramVariant;
    icon?: IconName;
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
}: PictogramTitleHeaderProps) => (
    <VStack alignItems="center" spacing="sp24">
        <Pictogram variant={variant} icon={icon} />
        <CenteredTitleHeader title={title} subtitle={subtitle} titleVariant={titleVariant} />
    </VStack>
);
