import { AssetSymbol } from '@suite/assets';
import { Translation } from '@suite/intl';

import { type TransactionReviewModalAction } from '#src/utils/suite/transactionReview';

type TransactionReviewActionLabelProps = {
    action: TransactionReviewModalAction;
};

export const TransactionReviewActionLabel = ({
    action: { id, values, assets = {} },
}: TransactionReviewActionLabelProps) => (
    <Translation
        id={id}
        values={{
            ...values,
            ...Object.fromEntries(
                Object.entries(assets).map(([placeholder, asset]) => [
                    placeholder,
                    <AssetSymbol
                        key={placeholder}
                        networkSymbol={asset.networkSymbol}
                        contractAddress={asset.contractAddress}
                    />,
                ]),
            ),
        }}
    />
);
