import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type CloseButtonProps = {
    handleClose: () => void;
};

export const CloseButton = ({ handleClose }: CloseButtonProps) => (
    <Button intent="critical" priority="secondary" onPress={handleClose}>
        <Translation id="generic.buttons.close" />
    </Button>
);
