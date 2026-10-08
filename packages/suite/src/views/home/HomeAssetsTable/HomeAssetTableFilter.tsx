import { useRef } from 'react';

import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { type HomeAssetGrouping, selectSmallBalanceSummary } from '@suite-common/assets';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import {
    GhostContainer,
    Icon,
    Menu,
    Popover,
    type PopoverRef,
    Row,
    Switch,
} from '@trezor/components';
import { CaretRightIcon, CheckIcon, FunnelSimpleIcon } from '@trezor/icons';

import { useSelector } from 'src/hooks/suite';

import { HomeAssetSmallBalancesLabel } from './HomeAssetSmallBalancesLabel';

type HomeAssetTableFilterProps = {
    grouping: HomeAssetGrouping;
    areSmallBalancesShown: boolean;
    onChange: (grouping: HomeAssetGrouping) => void;
    onSmallBalancesChange: (areShown: boolean) => void;
};

const HomeAssetTableFilter = ({
    grouping,
    areSmallBalancesShown,
    onChange,
    onSmallBalancesChange,
}: HomeAssetTableFilterProps) => {
    const popoverRef = useRef<PopoverRef>(null);
    const { dispatch } = useServices(injectDispatch);
    const smallBalances = useSelector(selectSmallBalanceSummary);

    const choose = (chosen: HomeAssetGrouping) => {
        onChange(chosen);
        popoverRef.current?.close();
    };

    return (
        <Popover
            ref={popoverRef}
            placement={{ position: 'bottom', alignment: 'start' }}
            content={
                <Menu
                    onClose={() => popoverRef.current?.close()}
                    items={[
                        {
                            label: <Translation id="TR_HOME_ASSET_GROUPING_DEFAULT" />,
                            iconRight: grouping === 'default' ? CheckIcon : undefined,
                            onClick: () => choose('default'),
                            'data-testid': '@dashboard/home-asset/grouping/default',
                        },
                        {
                            label: <Translation id="TR_HOME_ASSET_GROUPING_NETWORKS" />,
                            iconRight: grouping === 'networks' ? CheckIcon : undefined,
                            onClick: () => choose('networks'),
                            'data-testid': '@dashboard/home-asset/grouping/networks',
                        },
                        {
                            label: <HomeAssetSmallBalancesLabel />,
                            // The switch has to be seen changing, so this row leaves the menu open.
                            rightContent: (
                                <Row pointerEvents="none">
                                    <Switch
                                        size="small"
                                        isChecked={areSmallBalancesShown}
                                        data-testid="@dashboard/home-asset/small-balances"
                                    />
                                </Row>
                            ),
                            isHidden: smallBalances === undefined,
                            hasSeparatorBefore: true,
                            closeOnClick: false,
                            onClick: () => onSmallBalancesChange(!areSmallBalancesShown),
                        },
                        {
                            label: <Translation id="TR_HIDDEN_TOKENS" />,
                            iconRight: CaretRightIcon,
                            hasSeparatorBefore: true,
                            onClick: () =>
                                dispatch(gotoThunk({ routeName: 'suite-hidden-tokens' })),
                            'data-testid': '@dashboard/home-asset/hidden-tokens',
                        },
                    ]}
                />
            }
        >
            <GhostContainer
                padding={4}
                borderRadius={6}
                data-testid="@dashboard/home-asset/grouping"
            >
                <Icon
                    as={FunnelSimpleIcon}
                    size={16}
                    intent={grouping === 'networks' ? 'info' : 'neutral'}
                />
            </GhostContainer>
        </Popover>
    );
};

export const HomeAssetTableFilterHeader = (props: HomeAssetTableFilterProps) => (
    <Row gap={8} alignItems="center">
        <Translation id="TR_ASSET" />
        <HomeAssetTableFilter {...props} />
    </Row>
);
