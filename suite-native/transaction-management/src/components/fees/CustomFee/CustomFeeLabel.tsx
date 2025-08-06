import { type NetworkType } from '@suite-common/wallet-config';
import { getFeeUnits } from '@suite-common/wallet-utils';
import { Text, VStack } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';

import { FeesFormValues } from '../../../feesFormSchema';

type CustomFeeLabelProps = {
    networkType: NetworkType;
};

export const CustomFeeLabel = ({ networkType }: CustomFeeLabelProps) => {
    const feeUnits = getFeeUnits(networkType);

    const { watch } = useFormContext<FeesFormValues>();
    const { customFeeLimit, customFeePerUnit } = watch();

    const formattedFeePerUnit = `${customFeePerUnit} ${feeUnits}`;

    if (networkType === 'ethereum') {
        return (
            <VStack spacing="sp2" flex={1}>
                <Text variant="highlight">
                    <Translation id="transactionManagement.fees.custom.card.label" />
                </Text>
                <Text variant="hint" color="textSubdued" numberOfLines={1} adjustsFontSizeToFit>
                    <Translation
                        id="transactionManagement.fees.custom.card.ethereumValues"
                        values={{ gasPrice: formattedFeePerUnit, gasLimit: customFeeLimit }}
                    />
                </Text>
            </VStack>
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
