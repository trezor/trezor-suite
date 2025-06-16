import { useMemo } from 'react';

import styled from 'styled-components';

import { Icon } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { HELP_CENTER_ETH_STAKING, HELP_CENTER_SOL_STAKING } from '@trezor/urls';

import { Translation } from 'src/components/suite';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: ${spacingsPx.md};
    justify-content: space-between;
    padding-top: ${spacingsPx.xl};
    border-top: 1px solid ${({ theme }) => theme.borderElevation2};
    margin-top: ${spacingsPx.xxl};
`;

const Left = styled.div`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.textSubdued};
    gap: ${spacingsPx.xs};
`;

export const EverstakeFooter = () => {
    const account = useSelector(selectSelectedAccount);

    const learnMoreLink = useMemo(() => {
        switch (account?.networkType) {
            case 'ethereum':
                return HELP_CENTER_ETH_STAKING;
            case 'solana':
                return HELP_CENTER_SOL_STAKING;
            default:
                return undefined;
        }
    }, [account]);

    return (
        <Wrapper>
            <Left>
                <Translation id="TR_STAKE_PROVIDED_BY" />{' '}
                <Icon size={100} name="everstakeLogoText" variant="default" />
            </Left>
            {learnMoreLink && <LearnMoreButton url={learnMoreLink} />}
        </Wrapper>
    );
};
