import { useMemo } from 'react';

import styled from 'styled-components';

import { spacingsPx } from '@trezor/theme';
import {
    HELP_CENTER_ADA_STAKING,
    HELP_CENTER_ETH_STAKING,
    HELP_CENTER_SOL_STAKING,
} from '@trezor/urls';

import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { PoweredByBadge } from 'src/components/wallet';
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

    const learnMoreLink = useMemo(() => {
        switch (account?.networkType) {
            case 'ethereum':
                return HELP_CENTER_ETH_STAKING;
            case 'solana':
                return HELP_CENTER_SOL_STAKING;
            case 'cardano':
                return HELP_CENTER_ADA_STAKING;
            default:
                return undefined;
        }
    }, [account]);

    return (
        <Wrapper>
            <PoweredByBadge provider="everstake" />
            {learnMoreLink && <LearnMoreButton url={learnMoreLink} />}
        </Wrapper>
    );
};
