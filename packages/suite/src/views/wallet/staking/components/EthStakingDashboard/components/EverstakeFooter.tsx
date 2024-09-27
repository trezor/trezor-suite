import styled, { useTheme } from 'styled-components';
import { spacingsPx } from '@trezor/theme';
import { Translation } from 'src/components/suite';
import { EverstakeLogo } from './EverstakeLogo';
import { HELP_CENTER_ETH_STAKING } from '@trezor/urls';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';

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

    return (
        <Wrapper>
            <Left>
                <Translation id="TR_STAKE_PROVIDED_BY" />{' '}
                <EverstakeLogo color={isDarkMode ? '#fff' : '#000'} />
            </Left>
            <LearnMoreButton url={HELP_CENTER_ETH_STAKING} />
        </Wrapper>
    );
};
