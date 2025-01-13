import { Control, useWatch } from 'react-hook-form';

import { Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import {
    AccountFormValues,
    ALMOST_MAX_ACCOUNT_LABEL_LENGTH,
    MAX_ACCOUNT_LABEL_LENGTH,
} from '../hooks/useAccountLabelForm';

type AccountLabelFieldHintProps = {
    formControl: Control<AccountFormValues>;
};

function getTextColor(accountLabelLength: number) {
    if (accountLabelLength > MAX_ACCOUNT_LABEL_LENGTH) {
        return 'textAlertRed';
    }

    if (accountLabelLength > ALMOST_MAX_ACCOUNT_LABEL_LENGTH) {
        return 'textAlertYellow';
    }

    return 'textSubdued';
}

export const AccountLabelFieldHint = ({ formControl }: AccountLabelFieldHintProps) => {
    const { accountLabel } = useWatch({ control: formControl });

    const accountLabelLength = accountLabel ? accountLabel.length : 0;

    return (
        <Box paddingLeft="sp8">
            <Text variant="label" color={getTextColor(accountLabelLength)}>
                <Translation
                    id="accounts.accountLabelFieldHint.letterCount"
                    values={{
                        current: accountLabelLength,
                        max: MAX_ACCOUNT_LABEL_LENGTH,
                    }}
                />
            </Text>
        </Box>
    );
};
