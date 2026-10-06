import { type ReactNode } from 'react';

import { Column, Text } from '@trezor/components';

import { HiddenPlaceholder } from 'src/components/suite';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';

import { BlurWrapper } from './TransactionItemBlurWrapper';

type TransactionTargetLayoutProps = {
    addressLabel: ReactNode;
    amount?: ReactNode;
    fiatAmount?: ReactNode;
    useHiddenPlaceholder?: boolean;
    isBlurred?: boolean;
};

export const TransactionTargetLayout = ({
    addressLabel,
    amount,
    fiatAmount,
    useHiddenPlaceholder,
    isBlurred,
}: TransactionTargetLayoutProps) => {
    const { isBelowTablet } = useLayoutSize();

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
                {amount && <BlurWrapper $isBlurred={isBlurred ?? false}>{amount}</BlurWrapper>}
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
