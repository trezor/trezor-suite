import { type ReactNode } from 'react';

import { useAlert } from '@suite-native/alerts';
import { TextButton } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export type ExplanationTextProps = {
    children: ReactNode;
    title: ReactNode;
    description: ReactNode;
    testID?: string;
};

export const ExplanationText = ({ children, title, description, testID }: ExplanationTextProps) => {
    const { showAlert } = useAlert();

    const handlePress = () => {
        showAlert({
            title,
            description,
            textAlign: 'left',
            titleSpacing: 'sp4',
            primaryButtonTitle: <Translation id="generic.buttons.gotIt" />,
            testID: testID ? `${testID}/alert` : undefined,
        });
    };

    return (
        <TextButton
            accessibilityRole="button"
            iconRight="question"
            intent="neutral"
            isUnderlined
            onPress={handlePress}
            priority="secondary"
            size="small"
            testID={testID}
        >
            {children}
        </TextButton>
    );
};
