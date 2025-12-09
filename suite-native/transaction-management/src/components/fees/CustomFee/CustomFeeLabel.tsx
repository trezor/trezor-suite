import { type NetworkType } from '@suite-common/wallet-config';
import { getFeeUnits } from '@suite-common/wallet-utils';
import { HStack, Text } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';

import { FeesFormValues } from '../../../feesFormSchema';

type CustomFeeLabelProps = {
    networkType: NetworkType;
};
export const CustomFeeLabel = ({ networkType }: CustomFeeLabelProps) => {
    const feeUnits = getFeeUnits(networkType);

    const { watch } = useFormContext<FeesFormValues>();
    const { customFeePerUnit } = watch();

    const formattedFeePerUnit = `${Number(customFeePerUnit).toFixed(3)} ${feeUnits}`;

    if (networkType === 'ethereum') {
        return (
            <HStack spacing="sp2" flex={1} alignItems="center">
                <Text variant="highlight">
                    <Translation id="transactionManagement.fees.custom.card.label" />
                </Text>
                <Text>•</Text>
                <Text variant="hint" color="textSubdued">
                    {formattedFeePerUnit}
                </Text>
            </HStack>
        );
    }

    return (
        <Text variant="highlight">
            <Translation id="transactionManagement.fees.custom.card.label" />
            {' • '}
            <Text color="textSubdued">{formattedFeePerUnit}</Text>
        </Text>
    );
};
