import { useState } from 'react';
import { View } from 'react-native';

import { Button, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    LIST_VERTICAL_SPACING,
    ReviewOutputCard,
    SlidingFooterOverlay,
    useActiveStepOffset,
} from '@suite-native/transaction-management';

import { type YieldReviewListProps, getYieldReviewCards } from './YieldReviewListPresets';

export const YieldReviewList = ({
    accountKey,
    amount,
    fee,
    isFooterVisible = true,
    isSubmitDisabled = false,
    isSubmitLoading = false,
    onSubmit,
    tokenSymbol,
    ...variantProps
}: YieldReviewListProps) => {
    const { translate } = useTranslate();
    const [stepIndex, setStepIndex] = useState(0);
    const { activeStepBottomOffset, handleReadListItemHeight } = useActiveStepOffset(stepIndex);
    const cards = getYieldReviewCards(
        {
            accountKey,
            amount,
            fee,
            tokenSymbol,
            ...variantProps,
        },
        translate,
    );

    const isLastStep = stepIndex >= cards.length - 1;
    const actionTranslationId = isLastStep ? 'generic.buttons.continue' : 'generic.buttons.next';

    const getOutputState = (index: number) => {
        if (stepIndex > index) {
            return 'success';
        }

        if (stepIndex === index) {
            return 'active';
        }

        return undefined;
    };

    const handlePrimaryAction = () => {
        if (isLastStep) {
            onSubmit();

            return;
        }

        setStepIndex(previousStepIndex => previousStepIndex + 1);
    };

    return (
        <View>
            <VStack spacing={LIST_VERTICAL_SPACING}>
                {cards.map((card, index) => (
                    <View key={card.key} onLayout={event => handleReadListItemHeight(event, index)}>
                        <ReviewOutputCard title={card.title} outputState={getOutputState(index)}>
                            {card.content}
                        </ReviewOutputCard>
                    </View>
                ))}
            </VStack>

            {isFooterVisible && (
                <SlidingFooterOverlay activeStepOffset={activeStepBottomOffset}>
                    <Button
                        isDisabled={isSubmitDisabled && isLastStep}
                        isLoading={isSubmitLoading && isLastStep}
                        onPress={handlePrimaryAction}
                    >
                        <Translation id={actionTranslationId} />
                    </Button>
                </SlidingFooterOverlay>
            )}
        </View>
    );
};
