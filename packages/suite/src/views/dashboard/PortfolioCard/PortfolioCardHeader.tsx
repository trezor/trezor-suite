import { type ReactNode } from 'react';

import { SkeletonRectangle } from '@trezor/components';

import { FiatHeader } from 'src/components/wallet/FiatHeader';
import { ContentFlex, useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';
import { type Discovery } from 'src/types/wallet';

export type PortfolioCardHeaderProps = {
    discovery?: Discovery;
    fiatAmount: string;
    localCurrency: string;
    isDiscoveryRunning?: boolean;
    rightContent?: ReactNode;
};

export const PortfolioCardHeader = ({
    discovery,
    fiatAmount,
    localCurrency,
    isDiscoveryRunning,
    rightContent,
}: PortfolioCardHeaderProps) => {
    const isContentBelowBreakpoint = useIsContentBelowBreakpoint();

    const valueLoading = isDiscoveryRunning || (!discovery && isNaN(Number(fiatAmount)));

    return (
        <ContentFlex
            justifyContent="space-between"
            alignItems={isContentBelowBreakpoint ? 'flex-start' : 'center'}
            gap={8}
            margin={{ top: 16, horizontal: 24, bottom: 16 }}
        >
            {valueLoading ? (
                <SkeletonRectangle width={140} height={53} />
            ) : (
                <FiatHeader
                    data-testid="@dashboard/portfolio/fiat-amount"
                    size="large"
                    amount={fiatAmount}
                    localCurrency={localCurrency}
                />
            )}
            {rightContent}
        </ContentFlex>
    );
};
