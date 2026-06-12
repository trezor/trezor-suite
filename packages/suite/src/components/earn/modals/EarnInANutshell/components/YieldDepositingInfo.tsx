import { Translation } from '@suite/intl';
import { type YieldDto } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { BulletList } from '@trezor/components';

import { EarnYieldApyTooltip } from 'src/components/earn/dashboard/yield/EarnYieldApyTooltip';
import { formatApyValue } from 'src/components/earn/utils/earnApyUtils';

import { EarnInfoRow } from './EarnInfoRow';

type YieldDepositingInfoProps = {
    apy: number | null;
    vault: YieldDto | undefined;
    networkSymbol: NetworkSymbol;
    depositSymbol: string;
    vaultSymbol: string | undefined;
};

export const YieldDepositingInfo = ({
    apy,
    vault,
    networkSymbol,
    depositSymbol,
    vaultSymbol,
}: YieldDepositingInfoProps) => (
    <BulletList bulletGap={12} gap={16} bulletSize="small" titleGap={2}>
        <EarnInfoRow
            heading={
                <Translation
                    id="TR_EARN_YIELD_APPROVE_SPENDING_TRANSACTION"
                    values={{ supplySymbol: depositSymbol }}
                />
            }
            content={{ text: <Translation id="TR_TRADING_NETWORK_FEE" />, isBadge: true }}
        />
        <EarnInfoRow
            heading={<Translation id="TR_EARN_SIGN_DEPOSIT_TRANSACTION" />}
            subheading={
                <Translation
                    id="TR_EARN_YIELD_DEPOSIT_INTO_VAULT_SUB"
                    values={{ supplySymbol: depositSymbol }}
                />
            }
            content={{ text: <Translation id="TR_TRADING_NETWORK_FEE" />, isBadge: true }}
        />
        {vault && vaultSymbol && (
            <EarnInfoRow
                heading={
                    <Translation id="TR_EARN_YIELD_RECEIVE_VAULT_TOKENS" values={{ vaultSymbol }} />
                }
                subheading={<Translation id="TR_EARN_YIELD_EARN_REWARDS_EACH_BLOCK" />}
                content={{
                    text:
                        apy !== null && apy > 0 ? (
                            <EarnYieldApyTooltip
                                vault={vault}
                                apyPercentage={apy}
                                networkSymbol={networkSymbol}
                            >
                                <Translation
                                    id="TR_EARN_APY_APPROX"
                                    values={{ apyPercent: formatApyValue(apy) }}
                                />
                            </EarnYieldApyTooltip>
                        ) : (
                            <>
                                <Translation id="TR_EARN_APY_N_A" />{' '}
                                <Translation id="TR_STAKE_APY_ABBR" />
                            </>
                        ),
                }}
            />
        )}
    </BulletList>
);
