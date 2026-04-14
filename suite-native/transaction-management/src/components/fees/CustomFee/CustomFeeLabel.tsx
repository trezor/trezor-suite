import { type NetworkType } from '@suite-common/wallet-config';
import { getFeeUnits } from '@suite-common/wallet-utils';
import { HStack, Text } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';

import { type FeesFormValues } from '../../../feesFormSchema';

type CustomFeeLabelProps = {
    networkType: NetworkType;
};

const getFormattedFeeUnits = (fee: string, networkType: NetworkType) => {
    const value = Number(fee);
    switch (networkType) {
        case 'ethereum':
            return value.toFixed(2);
        default:
            return value;
    }
};
export const CustomFeeLabel = ({ networkType }: CustomFeeLabelProps) => {
    const feeUnits = getFeeUnits(networkType);

    const { watch } = useFormContext<FeesFormValues>();
    const { customFeePerUnit } = watch();

    const formattedFeePerUnit = `${getFormattedFeeUnits(customFeePerUnit, networkType)} ${feeUnits}`;

    if (networkType === 'ethereum') {
        return (
            <HStack spacing="sp2" flex={1} alignItems="center">
                <Text variant="body-md-strong">
                    <Translation id="transactionManagement.fees.custom.card.label" />
                </Text>
                <Text>•</Text>
                <Text variant="body-sm" color="contentSecondary">
                    {formattedFeePerUnit}
                </Text>
            </HStack>
        );
    }

    return (
        <Text variant="body-md-strong">
            <Translation id="transactionManagement.fees.custom.card.label" />
            {' • '}
            <Text color="contentSecondary">{formattedFeePerUnit}</Text>
        </Text>
    );
};
