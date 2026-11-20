import { Translation } from '@suite/intl';
import {
    formatStakingAmount,
    selectIsStakingAccountActive,
    selectStakeableStakingProductDescriptorBySymbol,
} from '@suite-common/earn-staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Banner, Card, Paragraph, Row } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';

import { BaseCurrencyValue } from '#src/components/suite/BaseCurrencyValue';
import { useSelector } from '#src/hooks/suite/useSelector';

type StakeRegistrationDepositCardProps = {
    account: Account;
};

export const StakeRegistrationDepositCard = ({ account }: StakeRegistrationDepositCardProps) => {
    const { symbol, key } = account;

    const isStakingActive = useSelector(state => selectIsStakingAccountActive(state, key));
    const isUpdateProviderFlow = isStakingActive && account.networkType === 'cardano';

    // The deposit the product the network stakes on asks for, in the network's main unit.
    const registrationDeposit = useSelector(
        state =>
            selectStakeableStakingProductDescriptorBySymbol(state, symbol)?.limits
                .registrationDeposit ?? null,
    );
    const formattedDeposit =
        registrationDeposit === null
            ? '0'
            : formatStakingAmount({ amount: registrationDeposit, networkSymbol: symbol });

    return (
        <Card paddingType="small" flex="1">
            <Row gap={20} justifyContent="space-between" margin={{ bottom: 16 }}>
                <Paragraph typographyStyle="body-md">
                    <Translation id="AMOUNT" />
                </Paragraph>
                <Paragraph
                    typographyStyle="body-md-strong"
                    data-testid="@modal/staking/stake-amount"
                >
                    <Translation id="TR_STAKE_FULL_BALANCE" />
                </Paragraph>
            </Row>

            {isUpdateProviderFlow ? (
                <Row gap={20} justifyContent="space-between">
                    <Paragraph typographyStyle="body-md">
                        <Translation id="TR_STAKING_NEW_PROVIDER" />
                    </Paragraph>
                    <Paragraph
                        typographyStyle="body-md-strong"
                        data-testid="@modal/staking/new-provider"
                    >
                        Everstake
                    </Paragraph>
                </Row>
            ) : (
                <>
                    <Row gap={20} justifyContent="space-between">
                        <Paragraph typographyStyle="body-md">
                            <Translation id="TR_STAKE_REGISTRATION_DEPOSIT" />
                        </Paragraph>
                        <Paragraph
                            data-testid="@modal/staking/registration-deposit-amount-with-symbol"
                            typographyStyle="body-md-strong"
                        >
                            {formattedDeposit} {getNetworkDisplaySymbol(symbol)}
                        </Paragraph>
                    </Row>
                    <Row gap={20} justifyContent="space-between">
                        <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                            <Translation id="TR_STAKE_RETURNED_TO_ACCOUNT_WHEN_UNSTAKE" />
                        </Paragraph>
                        <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                            ≈
                            <BaseCurrencyValue amount={formattedDeposit} symbol={symbol} />
                        </Paragraph>
                    </Row>
                </>
            )}
            <Banner
                intent="info"
                icon={InfoIcon}
                margin={{ top: 16 }}
                data-testid="@modal/staking/funds-banner"
                description={
                    <Translation
                        id={
                            isUpdateProviderFlow
                                ? 'TR_STAKING_REWARDS_REMAIN_INTACT'
                                : 'TR_STAKE_FUNDS_WARNING'
                        }
                        values={{
                            networkDisplaySymbol: getNetworkDisplaySymbol(symbol),
                        }}
                    />
                }
            />
        </Card>
    );
};
