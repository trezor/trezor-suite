import { memo } from 'react';

import { HiddenPlaceholder } from '@suite/discreet-mode';
import { type BigNumber } from '@trezor/utils';

import { FiatAmountHeadline } from './FiatAmountHeadline';

type HomeTotalBalanceProps = {
    fiatValue: BigNumber | undefined;
    'data-testid'?: string;
};

export const HomeTotalBalance = memo(
    ({
        fiatValue,
        'data-testid': dataTestId = '@dashboard/home-asset/fiat-amount',
    }: HomeTotalBalanceProps) => {
        // Nothing the wallet holds can be priced; a total of zero would say the wallet is empty.
        if (fiatValue === undefined) {
            return null;
        }

        return (
            <HiddenPlaceholder enforceIntensity={10}>
                <FiatAmountHeadline fiatValue={fiatValue} data-testid={dataTestId} />
            </HiddenPlaceholder>
        );
    },
);
