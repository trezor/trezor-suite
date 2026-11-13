import { useRef } from 'react';

import { Translation } from '@suite/intl';
import {
    type HomeAssetGrouping,
    type SmallBalanceSummary,
    selectIsHomeAssetTableMenuAvailable,
} from '@suite-common/assets';
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

import { useSelector } from '#src/hooks/suite';

import { HomeAssetSmallBalancesLabel } from './HomeAssetSmallBalancesLabel';

type HomeAssetTableFilterProps = {
    /** Left out where the rows are one network's, as an account's are: there is nothing to group. */
    grouping?: HomeAssetGrouping;
    areSmallBalancesShown: boolean;
    smallBalances: SmallBalanceSummary | undefined;
    onGroupingChange?: (grouping: HomeAssetGrouping) => void;
    onSmallBalancesChange: (areShown: boolean) => void;
    onOpenHiddenTokens: () => void;
};

const HomeAssetTableFilter = ({
    grouping,
    areSmallBalancesShown,
    smallBalances,
    onGroupingChange,
    onSmallBalancesChange,
    onOpenHiddenTokens,
}: HomeAssetTableFilterProps) => {
    const popoverRef = useRef<PopoverRef>(null);

    const choose = (chosen: HomeAssetGrouping) => {
        onGroupingChange?.(chosen);
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
                            isHidden: grouping === undefined,
                            onClick: () => choose('default'),
                            'data-testid': '@dashboard/home-asset/grouping/default',
                        },
                        {
                            label: <Translation id="TR_HOME_ASSET_GROUPING_NETWORKS" />,
                            iconRight: grouping === 'networks' ? CheckIcon : undefined,
                            isHidden: grouping === undefined,
                            onClick: () => choose('networks'),
                            'data-testid': '@dashboard/home-asset/grouping/networks',
                        },
                        {
                            label: <HomeAssetSmallBalancesLabel smallBalances={smallBalances} />,
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
                            hasSeparatorBefore: grouping !== undefined,
                            closeOnClick: false,
                            onClick: () => onSmallBalancesChange(!areSmallBalancesShown),
                            'data-testid': '@dashboard/home-asset/small-balances-toggle',
                        },
                        {
                            label: <Translation id="TR_HIDDEN_TOKENS" />,
                            iconRight: CaretRightIcon,
                            hasSeparatorBefore:
                                grouping !== undefined || smallBalances !== undefined,
                            onClick: onOpenHiddenTokens,
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

export const HomeAssetTableFilterHeader = (props: HomeAssetTableFilterProps) => {
    const isMenuAvailable = useSelector(selectIsHomeAssetTableMenuAvailable);

    return (
        <Row gap={8} alignItems="center">
            <Translation id="TR_ASSET" />
            {isMenuAvailable && <HomeAssetTableFilter {...props} />}
        </Row>
    );
};
