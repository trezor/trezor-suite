import { useRef } from 'react';

import { Translation } from '@suite/intl';
import { type HomeAssetGrouping } from '@suite-common/assets';
import { GhostContainer, Icon, Menu, Popover, type PopoverRef, Row } from '@trezor/components';
import { CheckIcon, FunnelSimpleIcon } from '@trezor/icons';

type HomeAssetTableFilterProps = {
    grouping: HomeAssetGrouping;
    onChange: (grouping: HomeAssetGrouping) => void;
};

const HomeAssetTableFilter = ({ grouping, onChange }: HomeAssetTableFilterProps) => {
    const popoverRef = useRef<PopoverRef>(null);

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

export const HomeAssetTableFilterHeader = ({ grouping, onChange }: HomeAssetTableFilterProps) => (
    <Row gap={8} alignItems="center">
        <Translation id="TR_ASSET" />
        <HomeAssetTableFilter grouping={grouping} onChange={onChange} />
    </Row>
);
