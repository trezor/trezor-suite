import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { type NetworkType } from '@suite-common/wallet-config';
import { Button, Text } from '@trezor/components';
import { HELP_CENTER_LIDO_STAKING } from '@trezor/urls';

import { PoweredByBadge } from '#src/components/earn/providers/PoweredByBadge';
import { getStakingGuideLink } from '#src/components/earn/utils/getStakingGuideLink';
import { useGuideOpenNode } from '#src/hooks/guide/useGuideOpenNode';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: space-between;
    border-top: 1px solid ${({ theme }) => theme.surfaceBorderRaised};
    margin-top: 32px;
    padding-top: 16px;
`;

type StakingFooterProps =
    { networkType: NetworkType; provider?: never } | { networkType?: never; provider: 'lido' };

export const StakingFooter = ({ networkType, provider }: StakingFooterProps) => {
    const { openNodeById } = useGuideOpenNode();

    const guideId = getStakingGuideLink(networkType);
    const helpCenterUrl = provider === 'lido' ? HELP_CENTER_LIDO_STAKING : undefined;
    const networkProviderName = networkType === 'tron' ? 'P2P.org & Luganodes' : undefined;
    const providerName = provider === 'lido' ? 'Lido' : networkProviderName;

    return (
        <Wrapper>
            {providerName ? (
                <Text intent="neutral" priority="secondary">
                    <Translation id="TR_STAKE_PROVIDED_BY" /> {providerName}
                </Text>
            ) : (
                <PoweredByBadge provider="everstake" />
            )}

            {(guideId || helpCenterUrl) && (
                <Button
                    href={helpCenterUrl}
                    onClick={guideId ? () => openNodeById(guideId) : undefined}
                    intent="neutral"
                    priority="secondary"
                    size="small"
                >
                    <Translation id="TR_LEARN_MORE" />
                </Button>
            )}
        </Wrapper>
    );
};
