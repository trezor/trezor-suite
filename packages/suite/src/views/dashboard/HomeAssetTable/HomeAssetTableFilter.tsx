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

import { type HomeAssetArrangement, type HomeAssetGrouping } from './homeAssetTableUtils';

type HomeAssetTableFilterProps = {
    arrangement: HomeAssetArrangement;
    onChange: (arrangement: HomeAssetArrangement) => void;
};

export const HomeAssetTableFilter = ({ arrangement, onChange }: HomeAssetTableFilterProps) => {
    const popoverRef = useRef<PopoverRef>(null);
    const { dispatch } = useServices(injectDispatch);

    const { grouping, areSmallBalancesShown } = arrangement;

    const choose = (chosen: HomeAssetGrouping) => {
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
                            label: <Translation id="TR_HOME_ASSET_SMALL_BALANCES" />,
                            elementRight: (
                                <Row pointerEvents="none">
                                    <Switch
                                        size="small"
                                        isChecked={areSmallBalancesShown}
                                        data-testid="@dashboard/home-asset/small-balances"
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
                    color={grouping === 'networks' ? 'contentInfo' : 'contentPrimary'}
                />
            </GhostContainer>
        </Popover>
    );
};

type HomeAssetTableFilterHeaderProps = HomeAssetTableFilterProps;

export const HomeAssetTableFilterHeader = ({
    arrangement,
    onChange,
}: HomeAssetTableFilterHeaderProps) => (
    <Row gap={8} alignItems="center">
        <Translation id="TR_ASSET" />
        <HomeAssetTableFilter arrangement={arrangement} onChange={onChange} />
    </Row>
);
