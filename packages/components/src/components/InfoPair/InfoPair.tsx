import { ReactNode } from 'react';

import { spacings } from '@trezor/theme';

import { FrameProps, FramePropsKeys } from '../../utils/frameProps';
import { TextPropsKeys, TextProps } from '../typography/utils';
import { Text, TextVariant } from '../typography/Text/Text';
import { Row } from '../Flex/Flex';

export const allowedInfoPairTextProps = ['typographyStyle'] as const satisfies TextPropsKeys[];
type AllowedTextProps = Pick<TextProps, (typeof allowedInfoPairTextProps)[number]>;

export const allowedInfoPairFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedInfoPairFrameProps)[number]>;

export type InfoPairProps = AllowedFrameProps &
    AllowedTextProps & {
        variant?: TextVariant;
    } & (
        | { leftContent: ReactNode; rightContent?: ReactNode }
        | { leftContent?: ReactNode; rightContent: ReactNode }
    );

export const InfoPair = ({
    leftContent,
    rightContent,
    typographyStyle,
    variant,
    margin,
}: InfoPairProps) => {
    return (
        <Text as="div" typographyStyle={typographyStyle} margin={margin} variant={variant}>
            <Row gap={spacings.xxs}>
                {leftContent}
                {leftContent && rightContent && <span>&bull;</span>}
                {rightContent}
            </Row>
        </Text>
    );
};
