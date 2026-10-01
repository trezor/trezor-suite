import { useRef } from 'react';

import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import {
    Button,
    GhostContainer,
    Icon,
    Menu,
    Popover,
    type PopoverRef,
    Row,
} from '@trezor/components';
import { CaretRightIcon, CheckIcon, FunnelSimpleIcon, XIcon } from '@trezor/icons';

import { type HomeAssetGrouping } from './homeAssetTableUtils';

type HomeAssetTableFilterProps = {
    grouping: HomeAssetGrouping;
    onChange: (grouping: HomeAssetGrouping) => void;
};

export const HomeAssetTableFilter = ({ grouping, onChange }: HomeAssetTableFilterProps) => {
    const popoverRef = useRef<PopoverRef>(null);
    const { dispatch } = useServices(injectDispatch);

    if (grouping === 'networks') {
        return (
            <Button
                size="small"
                intent="info"
                priority="secondary"
                iconRight={XIcon}
                onClick={() => onChange('default')}
                data-testid="@dashboard/home-asset/grouping/clear"
            >
                <Translation id="TR_HOME_ASSET_GROUPING_NETWORKS" />
            </Button>
        );
    }

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
                            iconRight: CheckIcon,
                            onClick: () => choose('default'),
                            'data-testid': '@dashboard/home-asset/grouping/default',
                        },
                        {
                            label: <Translation id="TR_HOME_ASSET_GROUPING_NETWORKS" />,
                            onClick: () => choose('networks'),
                            'data-testid': '@dashboard/home-asset/grouping/networks',
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
                <Icon as={FunnelSimpleIcon} size={16} intent="neutral" priority="secondary" />
            </GhostContainer>
        </Popover>
    );
};

type HomeAssetTableFilterHeaderProps = HomeAssetTableFilterProps;

export const HomeAssetTableFilterHeader = ({
    grouping,
    onChange,
}: HomeAssetTableFilterHeaderProps) => (
    <Row gap={8} alignItems="center">
        <Translation id="TR_ASSET" />
        <HomeAssetTableFilter grouping={grouping} onChange={onChange} />
    </Row>
);
