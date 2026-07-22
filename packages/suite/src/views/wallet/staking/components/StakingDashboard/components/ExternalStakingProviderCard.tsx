import { Translation } from '@suite/intl';
import { type NetworkSymbol, getDisplaySymbol } from '@suite-common/wallet-config';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { Banner } from '@trezor/components';
import { PuzzlePieceIcon } from '@trezor/icons';
import { BigNumber } from '@trezor/utils';

import { DashboardSection } from 'src/components/dashboard';
import { BaseCurrencyValue } from 'src/components/suite';

type ExternalStakingProviderCardProps = {
    symbol: NetworkSymbol;
    totalStaked: string;
};

export const ExternalStakingProviderCard = ({
    symbol,
    totalStaked,
}: ExternalStakingProviderCardProps) => {
    const displaySymbol = getDisplaySymbol(symbol);
    const totalStakedInUnits = subunitsToUnits({
        value: asAmountSubunit(new BigNumber(totalStaked || '0')),
        symbol,
    }).toString();

    return (
        <DashboardSection data-testid="@wallet/staking/outside-staking-card">
            <Banner
                icon={PuzzlePieceIcon}
                intent="neutral"
                title={<Translation id="TR_OUTSIDE_STAKING_CARD_TITLE" />}
                description={
                    <Translation
                        id="TR_OUTSIDE_STAKING_CARD_TEXT"
                        values={{
                            amount: totalStakedInUnits,
                            displaySymbol,
                            fiat: <BaseCurrencyValue amount={totalStakedInUnits} symbol={symbol} />,
                        }}
                    />
                }
            />
        </DashboardSection>
    );
};
