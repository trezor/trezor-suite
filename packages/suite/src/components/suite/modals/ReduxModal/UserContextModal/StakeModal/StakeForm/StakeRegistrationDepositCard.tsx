import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { CARDANO_STAKING_REGISTRATION_DEPOSIT } from '@suite-common/wallet-constants';
import { Account } from '@suite-common/wallet-types';
import { Banner, Card, Paragraph, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { Translation } from 'src/components/suite/Translation';

type StakeRegistrationDepositCardProps = {
    account: Account;
};

export const StakeRegistrationDepositCard = ({ account }: StakeRegistrationDepositCardProps) => {
    const { symbol } = account;

    return (
        <Card paddingType="small" flex="1">
            <Row gap={spacings.lg} justifyContent="space-between" margin={{ bottom: spacings.md }}>
                <Paragraph typographyStyle="body">
                    <Translation id="AMOUNT" />
                </Paragraph>
                <Paragraph typographyStyle="highlight">
                    <Translation id="TR_STAKE_ENTIRE_BALANCE" />
                </Paragraph>
            </Row>
            <Row gap={spacings.lg} justifyContent="space-between">
                <Paragraph typographyStyle="body">
                    <Translation id="TR_STAKE_REGISTRATION_DEPOSIT" />
                </Paragraph>
                <Paragraph typographyStyle="highlight">
                    {CARDANO_STAKING_REGISTRATION_DEPOSIT} {getNetworkDisplaySymbol(symbol)}
                </Paragraph>
            </Row>
            <Row gap={spacings.lg} justifyContent="space-between" margin={{ bottom: spacings.md }}>
                <Paragraph variant="tertiary" typographyStyle="hint">
                    <Translation id="TR_STAKE_RETURNED_TO_ACCOUNT_WHEN_UNSTAKE" />
                </Paragraph>
                <Paragraph variant="tertiary" typographyStyle="hint">
                    ≈
                    <BaseCurrencyValue
                        amount={CARDANO_STAKING_REGISTRATION_DEPOSIT}
                        symbol={symbol}
                    />
                </Paragraph>
            </Row>
            <Banner variant="info">
                <Translation
                    id="TR_STAKE_FUNDS_WARNING"
                    values={{
                        networkDisplaySymbol: getNetworkDisplaySymbol(symbol),
                    }}
                />
            </Banner>
        </Card>
    );
};
