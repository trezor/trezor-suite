import { useMemo } from 'react';

import styled, { useTheme } from 'styled-components';

import { spacingsPx } from '@trezor/theme';
import { HELP_CENTER_ETH_STAKING, HELP_CENTER_SOL_STAKING } from '@trezor/urls';

import { Translation } from 'src/components/suite';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

import { EverstakeLogo } from './EverstakeLogo';

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
    const theme = useTheme();
    const isDarkMode = theme.legacy.THEME === 'dark';

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
                <EverstakeLogo color={isDarkMode ? '#fff' : '#000'} />
            </Left>
            {learnMoreLink && <LearnMoreButton url={learnMoreLink} />}
        </Wrapper>
    );
};
