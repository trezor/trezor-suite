import { ReviewOutputType } from '@suite-common/wallet-types';
import { Text } from '@suite-native/atoms';
import { splitAddressToChunks } from '@suite-native/helpers';

import { ReviewOutputItemValues } from './ReviewOutputItemValues';

export const ReviewOutputItemContent = ({
    outputType,
    value,
}: {
    outputType: ReviewOutputType;
    value: string;
}) => {
    if (outputType === 'amount') {
        return (
            <ReviewOutputItemValues
                value={value}
                translationKey="moduleSend.review.outputs.amountLabel"
            />
        );
    }

    if (outputType === 'destination-tag') {
        return <Text variant="hint">{value}</Text>;
    }

    if (outputType === 'address' || outputType === 'regular_legacy' || outputType === 'contract') {
        const chunkedAddress = splitAddressToChunks(value).join(' ');

        return <Text variant="hint">{chunkedAddress}</Text>;
    }

    // TODO: handle other output types when are other coins supported (ETH feeGas etc.)
};
