import { useMemo } from 'react';

import styled from 'styled-components';

import { isStakedWithFiveBinaries } from '@suite-common/wallet-utils';
import { Icon } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import {
    HELP_CENTER_ADA_STAKING,
    HELP_CENTER_ETH_STAKING,
    HELP_CENTER_SOL_STAKING,
} from '@trezor/urls';

import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { Translation } from 'src/components/suite/Translation';
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

const Left = styled.div`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.textSubdued};
    gap: ${spacingsPx.xs};
`;

export const EverstakeFooter = () => {
    const account = useSelector(selectSelectedAccount);
    const cardanoStaking = useSelector(state => state.wallet.cardanoStaking);
    const { trezorPools } = cardanoStaking['mainnet'];
    const isFiveBinariesPool = isStakedWithFiveBinaries(account, trezorPools);

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
            <Left>
                <Translation id="TR_STAKE_PROVIDED_BY" />{' '}
                <Icon
                    size={isFiveBinariesPool ? 75 : 100}
                    name={isFiveBinariesPool ? 'fiveBinariesLogo' : 'everstakeLogoText'}
                    variant="default"
                />
            </Left>
            {learnMoreLink && <LearnMoreButton url={learnMoreLink} />}
        </Wrapper>
    );
};
