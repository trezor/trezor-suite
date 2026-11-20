import { memo } from 'react';

import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import { Row, Text } from '@trezor/components';
import { type BigNumber } from '@trezor/utils';

import { FiatAmountHeadline } from '#src/views/home/HomeBalance/FiatAmountHeadline';

type EarnTotalBalanceProps = {
    fiatValue: BigNumber | undefined;
    isIncomplete?: boolean;
    /** Every decimal of the value, as a price needs, rather than cents. */
    isExact?: boolean;
    dataTestId?: string;
};

export const EarnTotalBalance = memo(
    ({ fiatValue, isIncomplete = false, isExact, dataTestId }: EarnTotalBalanceProps) => {
        // Nothing the wallet holds can be priced; a total of zero would say the wallet is empty.
        if (fiatValue === undefined) {
            return (
                <HiddenPlaceholder enforceIntensity={10}>
                    <Text typographyStyle="headline-lg">
                        <Translation id="TR_EARN_N_A" />
                    </Text>
                </HiddenPlaceholder>
            );
        }

        return (
            <HiddenPlaceholder enforceIntensity={10}>
                <Row alignItems="baseline" data-testid={dataTestId}>
                    {isIncomplete && (
                        <Text
                            typographyStyle="headline-lg"
                            color="contentTertiary"
                            margin={{ right: 8 }}
                        >
                            ≈
                        </Text>
                    )}

                    <FiatAmountHeadline fiatValue={fiatValue} isExact={isExact} />
                </Row>
            </HiddenPlaceholder>
        );
    },
);
