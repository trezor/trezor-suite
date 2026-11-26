import { Translation } from '@suite/intl';
import {
    type ClaimableLidoWithdrawalRequest,
    getLidoClaimableAmount,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Button, Card, Row, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';

import { useNavigateToLidoRoute } from './useNavigateToLidoRoute';

const ETH_DECIMALS = 18;

type LidoClaimReadyCardProps = {
    account: Account;
    claimableRequests: readonly ClaimableLidoWithdrawalRequest[];
};

export const LidoClaimReadyCard = ({ account, claimableRequests }: LidoClaimReadyCardProps) => {
    const navigateToLidoRoute = useNavigateToLidoRoute(account);

    if (claimableRequests.length === 0) {
        return null;
    }

    const claimableAmount = new BigNumber(getLidoClaimableAmount(claimableRequests))
        .shiftedBy(-ETH_DECIMALS)
        .toFixed();

    return (
        <Card paddingType="none" data-testid="@staking/lido-claim-banner/container">
            <Row alignItems="center" gap={12} padding={{ horizontal: 16, vertical: 12 }}>
                <Text typographyStyle="body-sm-strong" flex="1" minWidth={0}>
                    <Translation
                        id="TR_EARN_LIDO_CLAIM_READY_AMOUNT"
                        values={{
                            amount: (
                                <FormattedCryptoAmount
                                    value={claimableAmount}
                                    networkSymbol={account.symbol}
                                    isCompact
                                />
                            ),
                        }}
                    />
                </Text>
                <Button
                    intent="neutral"
                    priority="primary"
                    size="small"
                    onClick={() => navigateToLidoRoute('earn-lido-claim')}
                    data-testid="@staking/lido-claim-banner/claim-button"
                >
                    <Translation id="TR_STAKE_CLAIM" />
                </Button>
            </Row>
        </Card>
    );
};
