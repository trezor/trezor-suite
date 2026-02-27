import { useMemo } from 'react';

import styled from 'styled-components';

import { spacingsPx } from '@trezor/theme';

import { PoweredByBadge, getStakingHelpCenterLink } from 'src/components/earn';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: ${spacingsPx.md};
    justify-content: space-between;
    border-top: 1px solid ${({ theme }) => theme.borderElevation2};
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
