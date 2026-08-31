import { useMemo } from 'react';

import styled from 'styled-components';

import { selectSelectedAccount } from '@suite/account';
import { Translation } from '@suite/intl';
import { useSelector } from '@suite-common/redux-utils';
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
