import { type ReactNode } from 'react';

import {
    Box,
    Column,
    RadioCard,
    Row,
    Skeleton,
    TOOLTIP_DELAY_NORMAL,
    Text,
    Tooltip,
} from '@trezor/components';
import { type RadioCardProps } from '@trezor/components';
import { type FeeLevel } from '@trezor/connect';

export const FEE_CARD_MIN_WIDTH = '170px';

export type FeeCardAppearance = {
    minWidth?: string;
    cardType?: RadioCardProps['type'];
};

export type FeeCardProps = FeeCardAppearance & {
    value: FeeLevel['label'];
    isSelected: boolean;
    changeFeeLevel: (level: FeeLevel['label']) => void;
    topLeftChild: ReactNode;
    topRightChild?: ReactNode;
    bottomLeftChild: ReactNode;
    bottomRightChild: ReactNode;
    tooltipContent?: ReactNode;
    isLoading?: boolean;
    'data-testid'?: string;
};

export const FeeCard = ({
    minWidth = FEE_CARD_MIN_WIDTH,
    cardType,
    value,
    isSelected,
    changeFeeLevel,
    topLeftChild,
    topRightChild,
    bottomLeftChild,
    bottomRightChild,
    tooltipContent,
    isLoading,
    'data-testid': dataTestId,
}: FeeCardProps) => (
    <Box data-testid={dataTestId} minWidth={minWidth} flex={`1 1 ${minWidth}`}>
        <Tooltip content={tooltipContent} delayShow={TOOLTIP_DELAY_NORMAL} display="block">
            <RadioCard
                type={cardType}
                onClick={() => changeFeeLevel(value)}
                isSelected={isSelected}
            >
                <Column>
                    <Row justifyContent="space-between">
                        <Text typographyStyle="body-md-strong">{topLeftChild}</Text>
                        <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                            {isLoading ? <Skeleton animate={true} /> : topRightChild}
                        </Text>
                    </Row>
                    <Row justifyContent="space-between" height={24}>
                        <Text>{isLoading ? <Skeleton animate={true} /> : bottomLeftChild}</Text>
                        <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                            {isLoading ? <Skeleton animate={true} /> : bottomRightChild}
                        </Text>
                    </Row>
                </Column>
            </RadioCard>
        </Tooltip>
    </Box>
);
