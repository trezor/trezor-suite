import { useMemo } from 'react';

import styled from 'styled-components';

import { selectSelectedAccount } from '@suite/account';
import { Translation } from '@suite/intl';
import { Button } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

import { PoweredByBadge } from 'src/components/earn';
import { getStakingGuideLink } from 'src/components/earn/utils/getStakingGuideLink';
import { useGuideOpenNode } from 'src/hooks/guide';
import { useSelector } from 'src/hooks/suite';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: ${spacingsPx.md};
    justify-content: space-between;
    border-top: 1px solid ${({ theme }) => theme.surfaceBorderRaised};
    margin-top: ${spacingsPx.xxl};
`;

export const EverstakeFooter = () => {
    const account = useSelector(selectSelectedAccount);
    const { openNodeById } = useGuideOpenNode();

    const moreInfoLink = useMemo(
        () => getStakingGuideLink(account?.networkType),
        [account?.networkType],
    );

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
