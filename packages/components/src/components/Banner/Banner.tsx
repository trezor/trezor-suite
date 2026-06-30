import { type ReactNode } from 'react';

import styled from 'styled-components';

import { spacingsPx } from '@trezor/theme';

import { BannerButton } from './BannerButton';
import { BannerContext } from './BannerContext';
import { BannerIconButton } from './BannerIconButton';
import { DEFAULT_INTENT } from './consts';
import { type BannerIntent } from './types';
import {
    mapIntentToBackgroundColor,
    mapIntentToBorderColor,
    mapIntentToIcon,
    mapIntentToIconColor,
} from './utils';
import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
} from '../../utils/frameProps';
import { Box } from '../Box/Box';
import { Row } from '../Flex/Flex';
import { Icon, type IconComponent } from '../Icon/Icon';
import { Spinner } from '../loaders/Spinner/Spinner';
import { H4 } from '../typography/Heading/Heading';
import { Paragraph } from '../typography/Paragraph/Paragraph';

const CONTAINER_BREAKPOINT = '440px';

const Layout = styled.div`
    container-type: inline-size;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
`;

const IconCell = styled.div`
    grid-column: 1;
    grid-row: 1;
    margin-right: ${spacingsPx.sm};
`;

const TextCell = styled.div`
    grid-column: 2;
`;

const ActionsCell = styled.div<{ $isMultiline: boolean }>`
    grid-column: 3;
    grid-row: ${({ $isMultiline }) => ($isMultiline ? '1 / span 2' : '1')};
    margin-left: ${spacingsPx.sm};

    @container (max-width: ${CONTAINER_BREAKPOINT}) {
        grid-column: 2;
        grid-row: auto;
        margin-left: 0;
        margin-top: ${spacingsPx.sm};
    }
`;

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
    icon?: IconComponent | true;
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
            borderColor={mapIntentToBorderColor(intent)}
            borderWidth={1}
            borderRadius={8}
            data-testid={dataTest}
            overflow="hidden"
            padding={{ vertical: 12, horizontal: 16 }}
            {...frameProps}
            width={width}
        >
            <Layout>
                {(isLoading || withIcon) && (
                    <IconCell>
                        {isLoading && <Spinner size={20} isDisabled={true} />}
                        {!isLoading && withIcon && (
                            <Icon
                                size={title ? 20 : 16}
                                as={icon === true ? mapIntentToIcon(intent) : icon}
                                color={mapIntentToIconColor(intent)}
                            />
                        )}
                    </IconCell>
                )}

                {title && (
                    <TextCell>
                        <H4 typographyStyle="body-md" intent={intent} priority="primary">
                            {title}
                        </H4>
                    </TextCell>
                )}
                {description && (
                    <TextCell>
                        <Paragraph
                            typographyStyle="body-sm"
                            intent={intent}
                            priority={title ? 'secondary' : 'primary'}
                            textWrap="pretty"
                        >
                            {description}
                        </Paragraph>
                    </TextCell>
                )}

                {rightContent && (
                    <ActionsCell $isMultiline={Boolean(title && description)}>
                        <BannerContext.Provider value={{ intent }}>
                            <Row gap={10}>{rightContent}</Row>
                        </BannerContext.Provider>
                    </ActionsCell>
                )}
            </Layout>
        </Box>
    );
};

Banner.Button = BannerButton;
Banner.IconButton = BannerIconButton;
