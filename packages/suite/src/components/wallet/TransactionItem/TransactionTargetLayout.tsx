import { type ReactNode } from 'react';

import { Column, Text } from '@trezor/components';

import { HiddenPlaceholder } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';
import { selectIsSuspiciousTransactionsBlurringDisabled } from 'src/selectors/suite/suiteSelectors';

import { BlurWrapper } from './TransactionItemBlurWrapper';

type TransactionTargetLayoutProps = {
    addressLabel: ReactNode;
    amount?: ReactNode;
    fiatAmount?: ReactNode;
    useHiddenPlaceholder?: boolean;
    isPhishingTransaction?: boolean;
};

export const TransactionTargetLayout = ({
    addressLabel,
    amount,
    fiatAmount,
    useHiddenPlaceholder,
    isPhishingTransaction,
}: TransactionTargetLayoutProps) => {
    const { isBelowTablet } = useLayoutSize();
    const isBlurringDisabled = useSelector(selectIsSuspiciousTransactionsBlurringDisabled);

    const commonProps = {
        typographyStyle: 'body-md',
        intent: 'neutral',
        priority: 'secondary',
        as: 'div',
    } as const;

    const cryptoAmountProps = {
        ...commonProps,
        priority: 'primary',
    } as const;

    const amounts = (
        <>
            <Text {...cryptoAmountProps} align="end">
                {amount && (
                    <BlurWrapper
                        $isBlurred={(isPhishingTransaction ?? false) && !isBlurringDisabled}
                    >
                        {amount}
                    </BlurWrapper>
                )}
            </Text>
            <Text {...commonProps} isTabular align="end">
                {fiatAmount}
            </Text>
        </>
    );

    return (
        <>
            <Text {...commonProps} ellipsisLineCount={1} padding={8} margin={-8}>
                {useHiddenPlaceholder === false ? (
                    addressLabel
                ) : (
                    <HiddenPlaceholder>{addressLabel}</HiddenPlaceholder>
                )}
            </Text>

            {isBelowTablet ? <Column>{amounts}</Column> : amounts}
        </>
    );
};
