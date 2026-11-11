import { Translation } from '@suite/intl';
import { BlurUrls } from '@trezor/components';
import type { TransactionFactValue as Value } from '@trezor/network-module-suite-common-types';
import { FeeRate } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils';

type TransactionFactValueProps = {
    value: Value;
};

/** Renders a fact the way it reads on every network, whichever network stated it. */
export const TransactionFactValue = ({ value }: TransactionFactValueProps) => {
    switch (value.kind) {
        case 'text':
            return value.isUserProvided ? (
                <BlurUrls tooltipContent={<Translation id="TR_URL_IN_TOKEN" />} text={value.text} />
            ) : (
                <>{value.text}</>
            );
        case 'count':
            return <>{value.value}</>;
        case 'feeRate':
            return <FeeRate feeRate={value.rate} unit={value.unit} />;
        case 'usage':
            return (
                <>
                    {value.limit}
                    {value.used !== undefined && (
                        <>
                            {' / '}
                            {value.used} (
                            {new BigNumber(value.used)
                                .div(value.limit)
                                .multipliedBy(100)
                                .toFixed(2)}
                            %)
                        </>
                    )}
                </>
            );
        case 'pendingUntilConfirmed':
            return <Translation id="TR_UNCONFIRMED_TX" />;
    }
};
