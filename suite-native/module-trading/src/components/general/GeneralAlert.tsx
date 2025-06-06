import { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { AnimatedBox, InlineAlertBox } from '@suite-native/atoms';

export type GeneralAlertProps = {
    text?: string;
};

export const GeneralAlert = ({ text }: GeneralAlertProps) => {
    if (!text) return null;

    return (
        <AnimatedBox entering={FadeIn} exiting={FadeOut} layout={LinearTransition}>
            <InlineAlertBox title={text} variant="critical" />
        </AnimatedBox>
    );
};
