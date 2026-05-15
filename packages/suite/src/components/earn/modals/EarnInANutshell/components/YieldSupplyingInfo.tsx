import { Translation } from '@suite/intl';
import { type YieldDto } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { BulletList } from '@trezor/components';

import { EarnYieldApyTooltip } from 'src/components/earn/dashboard/yield/EarnYieldApyTooltip';
import { formatApyValue } from 'src/components/earn/utils/earnApyUtils';

import { EarnInfoRow } from './EarnInfoRow';

type YieldSupplyingInfoProps = {
    apy: number | null;
    vault: YieldDto | undefined;
    networkSymbol: NetworkSymbol;
};

export const YieldSupplyingInfo = ({ apy, vault, networkSymbol }: YieldSupplyingInfoProps) => (
    <BulletList bulletGap={12} gap={16} bulletSize="small" titleGap={2}>
        <EarnInfoRow
            heading={<Translation id="TR_EARN_YIELD_APPROVE_SPENDING_TRANSACTION" />}
            content={{ text: <Translation id="TR_TRADING_NETWORK_FEE" />, isBadge: true }}
        />
        <EarnInfoRow
            heading={<Translation id="TR_EARN_SIGN_SUPPLYING_TRANSACTION" />}
            content={{ text: <Translation id="TR_TRADING_NETWORK_FEE" />, isBadge: true }}
        />
        {vault && (
            <EarnInfoRow
                heading={<Translation id="TR_EARN_YIELD_EARN_REWARDS_EACH_BLOCK" />}
                content={{
                    text: (
                        <>
                            {apy !== null && apy > 0 ? (
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
                            )}
                        </>
                    ),
                }}
            />
        )}
    </BulletList>
);
