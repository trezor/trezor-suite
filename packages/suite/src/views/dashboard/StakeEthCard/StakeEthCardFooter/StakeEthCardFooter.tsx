import { NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { Button, Paragraph, Row } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { useAccountSearch, useDispatch } from 'src/hooks/suite';

import { NetworkBadge } from './NetworkBadge';

type StakeEthCardFooterProps = {
    accountIndex: number | undefined;
    hideSection: () => void;
};

const symbol: NetworkSymbol = 'eth';

export const StakeEthCardFooter = ({ accountIndex = 0, hideSection }: StakeEthCardFooterProps) => {
    const dispatch = useDispatch();
    const { setCoinFilter, setSearchString } = useAccountSearch();

    const goToEthStakingTab = () => {
        dispatch(
            goto('wallet-staking', {
                params: {
                    symbol,
                    accountIndex,
                    accountType: 'normal',
                },
            }),
        );
        // activate coin filter and reset account search string
        setCoinFilter(symbol);
        setSearchString(undefined);

        analytics.report({
            type: EventType.StakingNavigate,
            payload: {
                action: 'navigate',
                from: 'dashboard/banner',
                networkSymbol: symbol,
            },
        });
    };

    const onMaybeLaterClick = () => {
        hideSection();

        analytics.report({
            type: EventType.StakingNavigate,
            payload: {
                action: 'cancel',
                from: 'dashboard/banner',
                networkSymbol: symbol,
            },
        });
    };

    return (
        <Row justifyContent="space-between" alignItems="center" gap={spacings.xs}>
            <div>
                <Paragraph variant="tertiary" typographyStyle="label">
                    <Translation id="TR_AVAILABLE_NOW_FOR" />
                </Paragraph>
                <NetworkBadge symbol={symbol} name={getNetwork(symbol).name} />
            </div>

            <Row gap={spacings.xs}>
                <Button onClick={goToEthStakingTab}>
                    <Translation id="TR_STAKE_START_STAKING" />
                </Button>
                <Button variant="tertiary" onClick={onMaybeLaterClick}>
                    <Translation id="TR_MAYBE_LATER" />
                </Button>
            </Row>
        </Row>
    );
};
