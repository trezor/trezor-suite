import { type Control, useWatch } from 'react-hook-form';

import { Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import {
    ALMOST_MAX_ACCOUNT_LABEL_LENGTH,
    type AccountFormValues,
    MAX_ACCOUNT_LABEL_LENGTH,
} from '../hooks/useAccountLabelForm';

export type AccountLabelFieldHintProps = {
    formControl: Control<AccountFormValues>;
};

function getTextColor(accountLabelLength: number) {
    if (accountLabelLength > MAX_ACCOUNT_LABEL_LENGTH) {
        return 'contentCritical';
    }

    if (accountLabelLength > ALMOST_MAX_ACCOUNT_LABEL_LENGTH) {
        return 'contentWarning';
    }

    return 'contentSecondary';
}

export const AccountLabelFieldHint = ({ formControl }: AccountLabelFieldHintProps) => {
    const { accountLabel } = useWatch({ control: formControl });

    const accountLabelLength = accountLabel ? accountLabel.length : 0;

    return (
        <Box paddingLeft="sp8">
            <Text variant="body-xs" color={getTextColor(accountLabelLength)}>
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
