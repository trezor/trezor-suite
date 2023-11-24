import styled from 'styled-components';
import { Button, P, variables } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { NetworkBadge } from './NetworkBadge';
import { useAccountSearch, useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';

const Wrapper = styled.div`
    padding: 22px 20px 20px 36px;
    border-top: 1px solid ${({ theme }) => theme.STROKE_LIGHT_GREY};
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
`;

const Flex = styled.div`
    margin-top: 6px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
`;

const Right = styled.div`
    display: flex;
    gap: 8px;
`;

const ButtonTertiary = styled(Button)`
    padding: 9px 22px;
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

interface FooterProps {
    accountIndex: number | undefined;
    hideSection: () => void;
}

export const Footer = ({ accountIndex = 0, hideSection }: FooterProps) => {
    const dispatch = useDispatch();
    const { setCoinFilter, setSearchString } = useAccountSearch();
    const goToEthStakingTab = () => {
        dispatch(
            goto('wallet-staking', {
                params: {
                    symbol: 'eth',
                    accountIndex,
                    accountType: 'normal',
                },
            }),
        );
        // activate coin filter and reset account search string
        setCoinFilter('eth');
        setSearchString(undefined);
    };

    return (
        <Wrapper>
            <div>
                <P size="tiny" weight="medium">
                    <Translation id="TR_AVAILABLE_NOW_FOR" />
                </P>
                {/* Flex is used because more networks will be available for staking in the future  */}
                <Flex>
                    <NetworkBadge logo="eth" name={<Translation id="TR_NETWORK_ETHEREUM" />} />
                </Flex>
            </div>

            <Right>
                <Button onClick={goToEthStakingTab}>
                    <Translation id="TR_START_STAKING" />
                </Button>
                <ButtonTertiary variant="tertiary" onClick={hideSection}>
                    <Translation id="TR_MAYBE_LATER" />
                </ButtonTertiary>
            </Right>
        </Wrapper>
    );
};
