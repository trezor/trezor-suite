import { Control, useWatch } from 'react-hook-form';

import { Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { AccountFormValues, MAX_ACCOUNT_LABEL_LENGTH } from '@suite-native/accounts';

type AccountLabelFieldHintProps = {
    formControl: Control<AccountFormValues>;
};

export const AccountLabelFieldHint = ({ formControl }: AccountLabelFieldHintProps) => {
    const { accountLabel } = useWatch({ control: formControl });

    const accountLabelLength = accountLabel ? accountLabel.length : 0;

    return (
        <Box paddingLeft="sp8">
            <Text variant="label" color="textSubdued">
                <Translation
                    id="moduleAccountManagement.accountLabelFieldHint.letterCount"
                    values={{
                        current: accountLabelLength,
                        max: MAX_ACCOUNT_LABEL_LENGTH,
                    }}
                />
            </Text>
        </Box>
    );
};
