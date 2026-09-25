import { useRef } from 'react';

import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
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

import { type AssetFirstArrangement, type AssetFirstGrouping } from './assetFirstTableUtils';

type AssetFirstTableFilterProps = {
    arrangement: AssetFirstArrangement;
    onChange: (arrangement: AssetFirstArrangement) => void;
};

export const AssetFirstTableFilter = ({ arrangement, onChange }: AssetFirstTableFilterProps) => {
    const popoverRef = useRef<PopoverRef>(null);
    const { dispatch } = useServices(injectDispatch);

    const { grouping, areSmallBalancesShown } = arrangement;

    const choose = (chosen: AssetFirstGrouping) => {
        onChange({ ...arrangement, grouping: chosen });
        popoverRef.current?.close();
    };

    const toggleSmallBalances = () =>
        onChange({ ...arrangement, areSmallBalancesShown: !areSmallBalancesShown });

    return (
        <Popover
            ref={popoverRef}
            placement={{ position: 'bottom', alignment: 'start' }}
            content={
                <Menu
                    onClose={() => popoverRef.current?.close()}
                    items={[
                        {
                            label: <Translation id="TR_ASSET_FIRST_GROUPING_DEFAULT" />,
                            iconRight: grouping === 'default' ? CheckIcon : undefined,
                            onClick: () => choose('default'),
                            'data-testid': '@dashboard/asset-first/grouping/default',
                        },
                        {
                            label: <Translation id="TR_ASSET_FIRST_GROUPING_NETWORKS" />,
                            iconRight: grouping === 'networks' ? CheckIcon : undefined,
                            onClick: () => choose('networks'),
                            'data-testid': '@dashboard/asset-first/grouping/networks',
                        },
                        {
                            label: <Translation id="TR_ASSET_FIRST_SMALL_BALANCES" />,
                            elementRight: (
                                <Row pointerEvents="none">
                                    <Switch
                                        size="small"
                                        isChecked={areSmallBalancesShown}
                                        data-testid="@dashboard/asset-first/small-balances"
                                    />
                                </Row>
                            ),
                            hasSeparatorBefore: true,
                            closeOnClick: false,
                            onClick: toggleSmallBalances,
                        },
                        {
                            label: <Translation id="TR_HIDDEN_TOKENS" />,
                            iconRight: CaretRightIcon,
                            hasSeparatorBefore: true,
                            onClick: () =>
                                dispatch(gotoThunk({ routeName: 'suite-hidden-tokens' })),
                            'data-testid': '@dashboard/asset-first/hidden-tokens',
                        },
                    ]}
                />
            }
        >
            <GhostContainer
                padding={4}
                borderRadius={6}
                data-testid="@dashboard/asset-first/grouping"
            >
                <Icon
                    as={FunnelSimpleIcon}
                    size={16}
                    color={grouping === 'networks' ? 'contentInfo' : 'contentPrimary'}
                />
            </GhostContainer>
        </Popover>
    );
};

type AssetFirstTableFilterHeaderProps = AssetFirstTableFilterProps;

export const AssetFirstTableFilterHeader = ({
    arrangement,
    onChange,
}: AssetFirstTableFilterHeaderProps) => (
    <Row gap={8} alignItems="center">
        <Translation id="TR_ASSET" />
        <AssetFirstTableFilter arrangement={arrangement} onChange={onChange} />
    </Row>
);
