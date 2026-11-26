import { type ReactNode } from 'react';

import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Row, Text } from '@trezor/components';
import { type TypographyStyle } from '@trezor/theme';
import { type BigNumber } from '@trezor/utils';

import { FiatAmountHeadline } from './FiatAmountHeadline';

type TotalBalanceHeadlineProps = {
    fiatValue: BigNumber | undefined;
    /** The total leaves out something without a rate, so it is marked as approximate. */
    isApproximate?: boolean;
    /** Every decimal of the value, as a price needs, rather than cents. */
    isExact?: boolean;
    /** What stands in for a total that nothing can be priced into; nothing by default. */
    fallback?: ReactNode;
    typographyStyle?: TypographyStyle;
    'data-testid'?: string;
};

export const TotalBalanceHeadline = ({
    fiatValue,
    isApproximate = false,
    isExact,
    fallback = null,
    typographyStyle = 'headline-lg',
    'data-testid': dataTestId,
}: TotalBalanceHeadlineProps) => {
    // Nothing held can be priced; a total of zero would say there is nothing held.
    if (fiatValue === undefined) {
        return fallback === null ? null : (
            <HiddenPlaceholder enforceIntensity={10}>
                <Text typographyStyle={typographyStyle}>{fallback}</Text>
            </HiddenPlaceholder>
        );
    }

    return (
        <HiddenPlaceholder enforceIntensity={10}>
            <Row alignItems="baseline" data-testid={dataTestId}>
                {isApproximate && (
                    <Text
                        typographyStyle={typographyStyle}
                        color="contentTertiary"
                        margin={{ right: 8 }}
                        data-testid={
                            dataTestId === undefined ? undefined : `${dataTestId}/approximate`
                        }
                    >
                        ≈
                    </Text>
                )}
                <FiatAmountHeadline
                    fiatValue={fiatValue}
                    isExact={isExact}
                    typographyStyle={typographyStyle}
                />
            </Row>
        </HiddenPlaceholder>
    );
};
