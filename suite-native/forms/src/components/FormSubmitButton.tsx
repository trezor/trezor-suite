import { type ComponentProps, type PropsWithChildren } from 'react';
import { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { AnimatedView, Button } from '@suite-native/atoms';

type FormSubmitButtonProps = PropsWithChildren<{
    isVisible: boolean;
}> &
    ComponentProps<typeof Button>;

export const FormSubmitButton = ({
    isVisible,
    onPress,
    children,
    ...restProps
}: FormSubmitButtonProps) => {
    if (!isVisible) {
        return null;
    }

    return (
        <AnimatedView entering={SlideInDown} exiting={SlideOutDown}>
            <Button onPress={onPress} {...restProps}>
                {children}
            </Button>
        </AnimatedView>
    );
};
