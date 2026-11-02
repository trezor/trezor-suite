import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { type NetworkType } from '@suite-common/wallet-config';
import { Button } from '@trezor/components';

import { PoweredByBadge } from 'src/components/earn';
import { getStakingGuideLink } from 'src/components/earn/utils/getStakingGuideLink';
import { useGuideOpenNode } from 'src/hooks/guide';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: space-between;
    border-top: 1px solid ${({ theme }) => theme.surfaceBorderRaised};
    margin-top: 32px;
`;

type EverstakeFooterProps = {
    networkType: NetworkType;
};

export const EverstakeFooter = ({ networkType }: EverstakeFooterProps) => {
    const { openNodeById } = useGuideOpenNode();

    const moreInfoLink = getStakingGuideLink(networkType);

    return (
        <Wrapper>
            <PoweredByBadge provider="everstake" />

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
