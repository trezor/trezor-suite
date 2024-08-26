import { ReactNode, useState } from 'react';
import { TouchableOpacity } from 'react-native';

import { Icon } from '@suite-common/icons';
import { BottomSheet, VStack, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type AddressReviewHelpSheetProps = {
    children: ReactNode;
    title?: ReactNode;
    subtitle?: ReactNode;
};

export const AddressReviewHelpSheet = ({
    children,
    title,
    subtitle,
}: AddressReviewHelpSheetProps) => {
    const [isVisible, setIsVisible] = useState(false);

    const handleOpen = () => setIsVisible(true);
    const handleClose = () => setIsVisible(false);

    return (
        <>
            <TouchableOpacity onPress={handleOpen}>
                <Icon name="questionLight" size="large" color="iconSubdued" />
            </TouchableOpacity>
            <BottomSheet
                isVisible={isVisible}
                onClose={handleClose}
                isCloseDisplayed={false}
                title={title}
                subtitle={subtitle}
            >
                <VStack spacing="large" paddingHorizontal="small">
                    {children}
                    <Button onPress={handleClose}>
                        <Translation id="generic.buttons.gotIt" />
                    </Button>
                </VStack>
            </BottomSheet>
        </>
    );
};
