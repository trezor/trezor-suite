import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type CloseButtonProps = {
    handleClose: () => void;
};

export const CloseButton = ({ handleClose }: CloseButtonProps) => (
    <Button colorScheme="redElevation0" onPress={handleClose}>
        <Translation id="generic.buttons.close" />
    </Button>
);
