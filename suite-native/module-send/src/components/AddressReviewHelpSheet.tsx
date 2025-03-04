import { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';

import { useAlert } from '@suite-native/alerts';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

type AddressReviewHelpSheetProps = {
    body: ReactNode;
    title?: ReactNode;
    subtitle?: ReactNode;
};

export const AddressReviewHelpSheet = ({ body, title, subtitle }: AddressReviewHelpSheetProps) => {
    const { showAlert } = useAlert();

    const handleOpen = () =>
        showAlert({
            title,
            description: subtitle,
            appendix: body,
            textAlign: 'left',
            primaryButtonTitle: <Translation id="generic.buttons.gotIt" />,
            titleSpacing: 'sp4',
        });

    return (
        <TouchableOpacity onPress={handleOpen}>
            <Icon name="question" size="large" color="iconSubdued" />
        </TouchableOpacity>
    );
};
