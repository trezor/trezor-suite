import { type ReactNode } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';
import { useSelector } from 'react-redux';

import { type DeviceRootState } from '@suite-common/device';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectSendFormReviewButtonRequestsCount } from '@suite-common/wallet-core';
import { type ReviewOutputState } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';
import {
    LIST_VERTICAL_SPACING,
    ReviewOutputCard,
    SlidingFooterOverlay,
    useActiveStepOffset,
} from '@suite-native/transaction-management';

export type YieldReviewCard = {
    content: ReactNode;
    key: string;
    title: ReactNode;
};

type YieldReviewListProps = {
    cards: YieldReviewCard[];
    footer?: ReactNode;
    isFooterVisible?: boolean;
    isSigned?: boolean;
    networkSymbol: NetworkSymbol;
};

type YieldReviewCardProps = {
    card: YieldReviewCard;
    onLayout: (event: LayoutChangeEvent) => void;
    outputState: ReviewOutputState;
};

const YieldReviewCard = ({ card, onLayout, outputState }: YieldReviewCardProps) => (
    <View onLayout={onLayout}>
        <ReviewOutputCard title={card.title} outputState={outputState}>
            {card.content}
        </ReviewOutputCard>
    </View>
);

export const YieldReviewList = ({
    cards,
    footer,
    isFooterVisible = true,
    isSigned = false,
    networkSymbol,
}: YieldReviewListProps) => {
    const buttonRequestsCount = useSelector((state: DeviceRootState) =>
        selectSendFormReviewButtonRequestsCount(state, networkSymbol),
    );
    const activeCardIndex = Math.min(buttonRequestsCount - 1, cards.length - 1);
    const activeStep = Math.max(activeCardIndex, 0);
    const { activeStepBottomOffset, handleReadListItemHeight } = useActiveStepOffset(activeStep);

    const getOutputState = (index: number): ReviewOutputState => {
        if (isSigned) {
            return 'success';
        }

        if (activeCardIndex < 0) {
            return undefined;
        }

        if (index < activeCardIndex) {
            return 'success';
        }

        if (index === activeCardIndex) {
            return 'active';
        }

        return undefined;
    };

    return (
        <>
            <VStack spacing={LIST_VERTICAL_SPACING}>
                {cards.map((card, index) => (
                    <YieldReviewCard
                        key={card.key}
                        card={card}
                        onLayout={event => handleReadListItemHeight(event, index)}
                        outputState={getOutputState(index)}
                    />
                ))}
            </VStack>
            {isFooterVisible && !isSigned && (
                <SlidingFooterOverlay activeStepOffset={activeStepBottomOffset}>
                    {footer}
                </SlidingFooterOverlay>
            )}
        </>
    );
};
