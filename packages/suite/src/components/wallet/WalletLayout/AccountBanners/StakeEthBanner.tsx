import { Button, Text, IconButton, Row, Warning, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { Translation } from 'src/components/suite';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { setFlag } from 'src/actions/suite/suiteActions';
import { selectSuiteFlags } from '../../../../reducers/suite/suiteReducer';
import { Account } from '@suite-common/wallet-types';
import { selectPoolStatsApyData } from '@suite-common/wallet-core';
import { isSupportedEthStakingNetworkSymbol } from '@suite-common/wallet-core';
import { MIN_ETH_AMOUNT_FOR_STAKING } from 'src/constants/suite/ethStaking';
import { useTheme } from 'styled-components';

interface StakeEthBannerProps {
    account: Account;
}

export const StakeEthBanner = ({ account }: StakeEthBannerProps) => {
    const dispatch = useDispatch();
    const { stakeEthBannerClosed } = useSelector(selectSuiteFlags);
    const { route } = useSelector(state => state.router);
    const ethApy = useSelector(state => selectPoolStatsApyData(state, account.symbol));
    const theme = useTheme();

    const closeBanner = () => {
        dispatch(setFlag('stakeEthBannerClosed', true));
    };

    const goToEthStakingTab = () => {
        dispatch(goto('wallet-staking', { preserveParams: true }));
    };

    if (
        route?.name !== 'wallet-index' ||
        stakeEthBannerClosed ||
        !account ||
        !isSupportedEthStakingNetworkSymbol(account.symbol)
    ) {
        return null;
    }

    return (
        <Warning
            variant="tertiary"
            icon="piggyBankFilled"
            rightContent={
                <Row gap={8}>
                    <Button size="small" onClick={goToEthStakingTab} textWrap={false}>
                        <Translation id="TR_STAKE_LEARN_MORE" />
                    </Button>
                    <IconButton
                        size="small"
                        variant="tertiary"
                        icon="close"
                        onClick={closeBanner}
                    />
                </Row>
            }
        >
            <Column gap={4} alignItems="flex-start" flex={1} margin={{ left: spacings.xs }}>
                <Text color={theme.textSubdued} typographyStyle="callout">
                    <Translation id="TR_STAKE_ETH_EARN_REPEAT" />
                </Text>

                <Text typographyStyle="body" textWrap="balance">
                    <Translation
                        id="TR_STAKE_ANY_AMOUNT_ETH"
                        values={{
                            apyPercent: ethApy,
                            symbol: account?.symbol.toUpperCase(),
                            amount: MIN_ETH_AMOUNT_FOR_STAKING.toString(),
                        }}
                    />
                </Text>
            </Column>
        </Warning>
    );
};
