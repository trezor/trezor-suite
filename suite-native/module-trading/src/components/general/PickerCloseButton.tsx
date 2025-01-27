import { Button, ButtonProps } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export type PickerCloseButtonProps = Omit<
    ButtonProps,
    'children' | 'colorScheme' | 'viewLeft' | 'viewRight'
>;

export const PickerCloseButton = (props: PickerCloseButtonProps) => (
    <Button colorScheme="tertiaryElevation0" {...props}>
        <Translation id="generic.buttons.close" />
    </Button>
);
