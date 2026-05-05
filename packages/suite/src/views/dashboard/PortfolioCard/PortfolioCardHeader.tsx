import { type ReactNode } from 'react';

import { Row, SkeletonRectangle } from '@trezor/components';

import { FiatHeader } from 'src/components/wallet/FiatHeader';
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
    const valueLoading = isDiscoveryRunning || (!discovery && isNaN(Number(fiatAmount)));

    return (
        <Row
            justifyContent="space-between"
            alignItems="center"
            gap={8}
            padding={{ vertical: 16, horizontal: 24 }}
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
        </Row>
    );
};
