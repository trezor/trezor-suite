import { useMemo } from 'react';

import styled from 'styled-components';

import { selectSelectedAccount } from '@suite/account';
import { LearnMoreButton } from '@suite/external-links';
import { spacingsPx } from '@trezor/theme';

import { PoweredByBadge, getStakingHelpCenterLink } from 'src/components/earn';
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

    const learnMoreLink = useMemo(
        () => getStakingHelpCenterLink(account?.networkType),
        [account?.networkType],
    );

    return (
        <Wrapper>
            <PoweredByBadge provider="everstake" />
            {learnMoreLink && <LearnMoreButton url={learnMoreLink} />}
        </Wrapper>
    );
};
