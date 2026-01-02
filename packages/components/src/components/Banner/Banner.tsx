import { ReactNode } from 'react';

import { useTheme } from 'styled-components';

import { BannerButton } from './BannerButton';
import { BannerContext } from './BannerContext';
import { BannerIconButton } from './BannerIconButton';
import { DEFAULT_INTENT } from './consts';
import { BannerIntent } from './types';
import {
    mapIntentToBackgroundColor,
    mapIntentToIcon,
    mapIntentToIconColor,
    mapIntentToTextColor,
} from './utils';
import { FrameProps, FramePropsKeys, pickAndPrepareFrameProps } from '../../utils/frameProps';
import { Box } from '../Box/Box';
import { Column, Row } from '../Flex/Flex';
import { Icon, IconName } from '../Icon/Icon';
import { Spinner } from '../loaders/Spinner/Spinner';
import { Text } from '../typography/Text/Text';

export const allowedBannerFrameProps = [
    'margin',
    'width',
    'minWidth',
    'maxWidth',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedBannerFrameProps)[number]>;

export type BannerProps = AllowedFrameProps & {
    children: ReactNode;
    intent?: BannerIntent;
    rightContent?: ReactNode;
    icon?: IconName | true;
    'data-testid'?: string;
    isLoading?: boolean;
};

export const Banner = ({
    children,
    intent = DEFAULT_INTENT,
    icon,
    rightContent,
    'data-testid': dataTest,
    isLoading = false,
    width = '100%',
    ...rest
}: BannerProps) => {
    const theme = useTheme();

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
            <Row gap={12} padding={{ vertical: 12, horizontal: 20 }}>
                {isLoading && <Spinner size={20} />}
                {!isLoading && withIcon && (
                    <Icon
                        size={20}
                        name={icon === true ? mapIntentToIcon(intent) : icon}
                        color={mapIntentToIconColor(intent, theme)}
                    />
                )}

                <Row flex="1" flexWrap="wrap" gap={12}>
                    <Column flex="1 1 300px" maxWidth="100%">
                        <Text
                            as="div"
                            typographyStyle="hint"
                            color={mapIntentToTextColor(intent, theme)}
                        >
                            {children}
                        </Text>
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
