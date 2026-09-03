import { type ReactNode } from 'react';

import { useAlert } from '@suite-native/alerts';
import { TextButton, type TextButtonProps } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export type ExplanationTextProps = {
    children: ReactNode;
    title: ReactNode;
    description: ReactNode;
    priority?: TextButtonProps['priority'];
    testID?: string;
};

export const ExplanationText = ({
    children,
    title,
    description,
    priority = 'secondary',
    testID,
}: ExplanationTextProps) => {
    const { showAlert } = useAlert();

    const handlePress = () => {
        showAlert({
            title,
            description,
            textAlign: 'left',
            titleSpacing: 'sp4',
            primaryButtonTitle: <Translation id="generic.buttons.gotIt" />,
            isClosableByOutsidePress: true,
            testID: testID ? `${testID}/alert` : undefined,
        });
    };

    return (
        <TextButton
            accessibilityRole="button"
            iconRight="question"
            intent="neutral"
            isUnderlined
            isDotted
            onPress={handlePress}
            priority={priority}
            size="small"
            testID={testID}
        >
            {children}
        </TextButton>
    );
};
