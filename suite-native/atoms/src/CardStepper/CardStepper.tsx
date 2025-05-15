import { ReactNode, useState } from 'react';

import { IconName } from '@suite-native/icons';

import { VStack } from '../Stack';
import { CardStepperButtonsActionType, CardStepperItem } from './CardStepperItem';

export type CardStepperMap<ContentIdType = undefined> = Record<
    number,
    {
        header: ReactNode;
        description: ReactNode;
        icon: IconName;
        secondaryButtonParameter?: ContentIdType;
    }
>;

type CardStepperProps<ContentIdType = undefined> = {
    onFinish: () => void;
    onPressSecondaryButton: (id?: ContentIdType) => void;
    buttonsActionType?: CardStepperButtonsActionType;
    stepToContentMap: CardStepperMap<ContentIdType>;
};

// prettier-ignore
export const CardStepper = <ContentIdType = undefined>({
    stepToContentMap,
    onFinish,
    onPressSecondaryButton,
    buttonsActionType,
}: CardStepperProps<ContentIdType>) => {
    const [currentStep, setCurrentStep] = useState<number>(1);

    const handlePressConfirmButton = () => {
        if (currentStep < Object.entries(stepToContentMap).length) {
            setCurrentStep(currentStep + 1);

            return;
        }

        onFinish();
    };

    const handlePressSecondaryButton = (contentId?: ContentIdType) => {
        if (contentId) {
            onPressSecondaryButton(contentId);
        } else {
            onPressSecondaryButton()
        }
    };

    return (
        <VStack spacing="sp16">
            {Object.entries(stepToContentMap).map(([stepIndex, content]) => (
                <CardStepperItem
                    key={stepIndex}
                    isChecked={currentStep > Number(stepIndex)}
                    isOpened={currentStep === Number(stepIndex)}
                    onPressConfirmButton={handlePressConfirmButton}
                    icon={content.icon}
                    header={content.header}
                    description={content.description}
                    buttonsActionType={buttonsActionType}
                    onPressSecondaryButton={() => handlePressSecondaryButton(content.secondaryButtonParameter)}
                />
            ))}
        </VStack>
    );
};
