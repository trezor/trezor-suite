import { ReactNode } from 'react';

import {
    Box,
    Column,
    RadioCard,
    Row,
    SkeletonRectangle,
    TOOLTIP_DELAY_NORMAL,
    Text,
    Tooltip,
} from '@trezor/components';
import { FeeLevel } from '@trezor/connect';

export const FEE_CARD_MIN_WIDTH = 170;

type FeeCardProps = {
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
    <Box data-testid={dataTestId} minWidth={FEE_CARD_MIN_WIDTH}>
        <Tooltip content={tooltipContent} delayShow={TOOLTIP_DELAY_NORMAL}>
            <RadioCard onClick={() => changeFeeLevel(value)} isActive={isSelected}>
                <Column>
                    <Row justifyContent="space-between">
                        <Text typographyStyle="highlight">{topLeftChild}</Text>
                        <Text variant="tertiary" typographyStyle="hint">
                            {isLoading ? <SkeletonRectangle animate={true} /> : topRightChild}
                        </Text>
                    </Row>
                    <Row justifyContent="space-between" height={24}>
                        <Text>
                            {isLoading ? <SkeletonRectangle animate={true} /> : bottomLeftChild}
                        </Text>
                        <Text variant="tertiary" typographyStyle="hint">
                            {isLoading ? <SkeletonRectangle animate={true} /> : bottomRightChild}
                        </Text>
                    </Row>
                </Column>
            </RadioCard>
        </Tooltip>
    </Box>
);
