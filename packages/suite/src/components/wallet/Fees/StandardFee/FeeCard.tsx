import React from 'react';

import {
    Box,
    Column,
    RadioCard,
    Row,
    TOOLTIP_DELAY_NORMAL,
    Text,
    Tooltip,
} from '@trezor/components';
import { FeeLevel } from '@trezor/connect';

type FeeCardProps = {
    value: FeeLevel['label'];
    isSelected: boolean;
    changeFeeLevel: (level: FeeLevel['label']) => void;
    topLeftChild: React.ReactNode;
    topRightChild?: React.ReactNode;
    bottomLeftChild: React.ReactNode;
    bottomRightChild: React.ReactNode;
    tooltipContent?: React.ReactNode;
};

export const FEE_CARD_MIN_WIDTH = 220;

export const FeeCard = ({
    value,
    isSelected,
    changeFeeLevel,
    topLeftChild,
    topRightChild,
    bottomLeftChild,
    bottomRightChild,
    tooltipContent,
}: FeeCardProps) => (
    <Box minWidth={FEE_CARD_MIN_WIDTH}>
        <Tooltip content={tooltipContent} delayShow={TOOLTIP_DELAY_NORMAL}>
            <RadioCard onClick={() => changeFeeLevel(value)} isActive={isSelected}>
                <Column>
                    <Row justifyContent="space-between">
                        <Text typographyStyle="highlight">{topLeftChild}</Text>
                        <Text variant="tertiary" typographyStyle="hint">
                            {topRightChild}
                        </Text>
                    </Row>
                    <Row justifyContent="space-between" height={24}>
                        <Text>{bottomLeftChild}</Text>
                        <Text variant="tertiary" typographyStyle="hint">
                            {bottomRightChild}
                        </Text>
                    </Row>
                </Column>
            </RadioCard>
        </Tooltip>
    </Box>
);
