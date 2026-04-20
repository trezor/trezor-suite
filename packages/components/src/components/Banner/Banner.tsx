import { type ReactNode } from 'react';

import { BannerButton } from './BannerButton';
import { BannerContext } from './BannerContext';
import { BannerIconButton } from './BannerIconButton';
import { DEFAULT_INTENT } from './consts';
import { type BannerIntent } from './types';
import { mapIntentToBackgroundColor, mapIntentToIcon, mapIntentToIconColor } from './utils';
import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
} from '../../utils/frameProps';
import { Box } from '../Box/Box';
import { Column, Row } from '../Flex/Flex';
import { Icon, type IconName } from '../Icon/Icon';
import { Spinner } from '../loaders/Spinner/Spinner';
import { H4 } from '../typography/Heading/Heading';
import { Paragraph } from '../typography/Paragraph/Paragraph';

export const allowedBannerFrameProps = [
    'margin',
    'width',
    'minWidth',
    'maxWidth',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedBannerFrameProps)[number]>;

export type BannerProps = AllowedFrameProps & {
    intent?: BannerIntent;
    rightContent?: ReactNode;
    icon?: IconName | true;
    'data-testid'?: string;
    isLoading?: boolean;
} & ({ title: ReactNode; description?: ReactNode } | { title?: ReactNode; description: ReactNode });

export const Banner = ({
    title,
    description,
    intent = DEFAULT_INTENT,
    icon,
    rightContent,
    'data-testid': dataTest,
    isLoading = false,
    width = '100%',
    ...rest
}: BannerProps) => {
    const withIcon = icon !== undefined;
    const frameProps = pickAndPrepareFrameProps(rest, allowedBannerFrameProps, false);

    return (
        <Box
            as="section"
            backgroundColor={mapIntentToBackgroundColor(intent)}
            borderRadius={8}
            data-testid={dataTest}
            {...frameProps}
            width={width}
        >
            <Row gap={16} padding={{ vertical: 12, horizontal: 20 }}>
                {isLoading && <Spinner size={20} isDisabled={true} />}
                {!isLoading && withIcon && (
                    <Icon
                        size={20}
                        name={icon === true ? mapIntentToIcon(intent) : icon}
                        color={mapIntentToIconColor(intent)}
                    />
                )}

                <Row flex="1" flexWrap="wrap" gap={12}>
                    <Column flex="1 1 360px" maxWidth="100%">
                        {title && (
                            <H4 typographyStyle="body-md" intent={intent} priority="primary">
                                {title}
                            </H4>
                        )}
                        {description && (
                            <Paragraph typographyStyle="body-sm" intent={intent} priority="primary">
                                {description}
                            </Paragraph>
                        )}
                    </Column>
                    {rightContent && (
                        <BannerContext.Provider value={{ intent }}>
                            <Row gap={10}>{rightContent}</Row>
                        </BannerContext.Provider>
                    )}
                </Row>
            </Row>
        </Box>
    );
};

Banner.Button = BannerButton;
Banner.IconButton = BannerIconButton;
