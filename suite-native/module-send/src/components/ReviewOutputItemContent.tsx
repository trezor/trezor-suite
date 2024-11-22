import { NetworkSymbol } from '@suite-common/wallet-config';
import { Text } from '@suite-native/atoms';
import { ReviewOutputType } from '@suite-common/wallet-types';
import { splitAddressToChunks } from '@suite-native/helpers';

import { ReviewOutputItemValues } from './ReviewOutputItemValues';

export const ReviewOutputItemContent = ({
    outputType,
    networkSymbol,
    value,
}: {
    outputType: ReviewOutputType;
    value: string;
    networkSymbol: NetworkSymbol;
}) => {
    if (outputType === 'amount') {
        return (
            <ReviewOutputItemValues
                value={value}
                networkSymbol={networkSymbol}
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
