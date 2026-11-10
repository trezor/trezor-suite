import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { type NetworkType } from '@suite-common/wallet-config';
import { Button, Text } from '@trezor/components';

import { PoweredByBadge } from '#src/components/earn/providers/PoweredByBadge';
import { getStakingGuideLink } from '#src/components/earn/utils/getStakingGuideLink';
import { useGuideOpenNode } from '#src/hooks/guide';

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

type StakingFooterProps = {
    networkType: NetworkType;
};

export const StakingFooter = ({ networkType }: StakingFooterProps) => {
    const { openNodeById } = useGuideOpenNode();

    const moreInfoLink = getStakingGuideLink(networkType);

    return (
        <Wrapper>
            {networkType === 'tron' ? (
                <Text intent="neutral" priority="secondary">
                    <Translation id="TR_STAKE_PROVIDED_BY" /> P2P.org &amp; Luganodes
                </Text>
            ) : (
                <PoweredByBadge provider="everstake" />
            )}

            {moreInfoLink && (
                <Button
                    onClick={() => openNodeById(moreInfoLink)}
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
