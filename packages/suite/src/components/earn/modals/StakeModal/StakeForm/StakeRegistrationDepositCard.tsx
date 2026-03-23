import { Translation } from '@suite/intl';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { CARDANO_STAKING_REGISTRATION_DEPOSIT } from '@suite-common/wallet-constants';
import {
    selectAccountIsStakingActive,
    selectVotingDelegationOption,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Banner, Card, Paragraph, Row } from '@trezor/components';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { useSelector } from 'src/hooks/suite';

type StakeRegistrationDepositCardProps = {
    account: Account;
};

export const StakeRegistrationDepositCard = ({ account }: StakeRegistrationDepositCardProps) => {
    const { symbol, key } = account;

    const selectedVotingDelegation = useSelector(selectVotingDelegationOption);

    const isStakingActive = useSelector(state => selectAccountIsStakingActive(state, key ?? ''));
    const isUpdateProviderFlow = isStakingActive && account.networkType === 'cardano';

    return (
        <Card paddingType="small" flex="1">
            <Row gap={20} justifyContent="space-between" margin={{ bottom: 16 }}>
                <Paragraph typographyStyle="body-md">
                    <Translation id="AMOUNT" />
                </Paragraph>
                <Paragraph typographyStyle="body-md-strong">
                    <Translation id="TR_STAKE_FULL_BALANCE" />
                </Paragraph>
            </Row>

            {isUpdateProviderFlow ? (
                <Row gap={20} justifyContent="space-between">
                    <Paragraph typographyStyle="body-md">
                        <Translation id="TR_STAKING_NEW_PROVIDER" />
                    </Paragraph>
                    <Paragraph typographyStyle="body-md-strong">Everstake</Paragraph>
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
                            {CARDANO_STAKING_REGISTRATION_DEPOSIT} {getNetworkDisplaySymbol(symbol)}
                        </Paragraph>
                    </Row>
                    <Row gap={20} justifyContent="space-between">
                        <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                            <Translation id="TR_STAKE_RETURNED_TO_ACCOUNT_WHEN_UNSTAKE" />
                        </Paragraph>
                        <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                            ≈
                            <BaseCurrencyValue
                                amount={CARDANO_STAKING_REGISTRATION_DEPOSIT}
                                symbol={symbol}
                            />
                        </Paragraph>
                    </Row>
                </>
            )}
            {selectedVotingDelegation.type === 'another_drep' && (
                <>
                    <Row gap={20} justifyContent="space-between">
                        <Paragraph typographyStyle="body-md">
                            <Translation id="TR_STAKING_DREP_ID" />
                        </Paragraph>
                    </Row>
                    <Row gap={20} justifyContent="space-between">
                        <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                            {selectedVotingDelegation.drepId}
                        </Paragraph>
                    </Row>
                </>
            )}
            <Banner
                intent="info"
                icon="info"
                margin={{ top: 16 }}
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
