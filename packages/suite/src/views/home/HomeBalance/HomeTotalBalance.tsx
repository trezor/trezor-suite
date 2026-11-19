import { memo } from 'react';

import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Row, Text } from '@trezor/components';
import { type BigNumber } from '@trezor/utils';

import { FiatAmountHeadline } from './FiatAmountHeadline';

type HomeTotalBalanceProps = {
    fiatValue: BigNumber | undefined;
    /** The total leaves out something without a rate, so it is marked as approximate. */
    isApproximate?: boolean;
    'data-testid'?: string;
};

export const HomeTotalBalance = memo(
    ({
        fiatValue,
        isApproximate = false,
        'data-testid': dataTestId = '@dashboard/home-asset/fiat-amount',
    }: HomeTotalBalanceProps) => {
        // Nothing the wallet holds can be priced; a total of zero would say the wallet is empty.
        if (fiatValue === undefined) {
            return null;
        }

        const headline = <FiatAmountHeadline fiatValue={fiatValue} data-testid={dataTestId} />;

        return (
            <HiddenPlaceholder enforceIntensity={10}>
                {isApproximate ? (
                    <Row alignItems="baseline">
                        <Text
                            typographyStyle="headline-lg"
                            color="contentTertiary"
                            margin={{ right: 8 }}
                            data-testid={`${dataTestId}/approximate`}
                        >
                            ≈
                        </Text>
                        {headline}
                    </Row>
                ) : (
                    headline
                )}
            </HiddenPlaceholder>
        );
    },
);
