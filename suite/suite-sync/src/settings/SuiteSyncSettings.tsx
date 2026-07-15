import { useState } from 'react';
import { useSelector } from 'react-redux';

import { selectIsTorEnabled } from '@suite/tor';
import { useServices } from '@suite-common/dependency-injection';
import {
    type WithSuiteSyncState,
    getSuiteSyncDefaultRelayUrl,
    getSuiteSyncRelayUrl,
    selectIsSuiteSyncFeatureAvailable,
    selectSuiteSyncCustomRelayUrl,
} from '@suite-common/suite-sync';
import { selectChangeRelayUrlDep } from '@suite-common/suite-sync-types';
import { Button, ButtonGroup, Code, Column, Input, Text } from '@trezor/components';
import { ActionColumn, SectionItem, SettingsSection, TextColumn } from '@trezor/product-components';
import { type BreakpointFlags, spacings } from '@trezor/theme';

import { SuiteSyncSettingsDebug } from './SuiteSyncSettingsDebug';
import { WipeSuiteSyncLabels, type WipeSuiteSyncLabelsOnError } from './WipeSuiteSyncLabels';

const selectIsBelowLaptop = (state: { window: BreakpointFlags }) => state.window.isBelowLaptop;

type SuiteSyncSettingsProps = {
    onError: WipeSuiteSyncLabelsOnError;
};

export const SuiteSyncSettings = ({ onError }: SuiteSyncSettingsProps) => {
    const [isRelayUrlLoading, setIsRelayUrlLoading] = useState(false);

    const { changeRelayUrl } = useServices(selectChangeRelayUrlDep);

    const isBelowLaptop = useSelector(selectIsBelowLaptop);

    const isSuiteSyncFeatureEnabled = useSelector(selectIsSuiteSyncFeatureAvailable);
    const isTorEnabled = useSelector(selectIsTorEnabled);
    const suiteSyncCustomRelayUrl = useSelector((state: WithSuiteSyncState) =>
        selectSuiteSyncCustomRelayUrl(state),
    );

    const [relayUrl, setRelayUrl] = useState(suiteSyncCustomRelayUrl ?? '');

    const onRelayUrlSave = async (url = relayUrl) => {
        setIsRelayUrlLoading(true);

        setRelayUrl(url);

        await changeRelayUrl({ relayUrl: url });

        // Fake it, to make some UI interaction for the user
        setTimeout(() => {
            setIsRelayUrlLoading(false);
        }, 300);
    };

    const onRelayUrlPresetClick = (url: string) => {
        setRelayUrl(url);
        void onRelayUrlSave(url);
    };

    if (!isSuiteSyncFeatureEnabled) return null;

    return (
        <SettingsSection title="Suite Sync" hasVerticalLayout={isBelowLaptop}>
            <SectionItem>
                <TextColumn title="Relay URL" />
                <ActionColumn>
                    <Column gap={spacings.xxs}>
                        <Input
                            data-testid="@settings/debug/suite-sync/relay-url-input"
                            isDisabled={isRelayUrlLoading}
                            value={relayUrl}
                            onChange={e => setRelayUrl(e.target.value)}
                            rightContent={
                                <Button
                                    data-testid="@settings/debug/suite-sync/save-button"
                                    isLoading={isRelayUrlLoading}
                                    onClick={() => onRelayUrlSave()}
                                    size="small"
                                >
                                    Save
                                </Button>
                            }
                        />
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            Default is: <Code>{getSuiteSyncDefaultRelayUrl({ isTorEnabled })}</Code>
                        </Text>
                        <ButtonGroup size="small" priority="secondary">
                            <Button
                                intent="critical"
                                isDisabled={isRelayUrlLoading}
                                onClick={() =>
                                    onRelayUrlPresetClick(
                                        getSuiteSyncRelayUrl({ env: 'prod', isTorEnabled }),
                                    )
                                }
                            >
                                Production
                            </Button>
                            <Button
                                intent="brand"
                                isDisabled={isRelayUrlLoading}
                                onClick={() =>
                                    onRelayUrlPresetClick(
                                        getSuiteSyncRelayUrl({ env: 'dev', isTorEnabled }),
                                    )
                                }
                            >
                                Dev
                            </Button>
                            <Button
                                intent="info"
                                isDisabled={isRelayUrlLoading}
                                onClick={() =>
                                    onRelayUrlPresetClick(
                                        getSuiteSyncRelayUrl({ env: 'local', isTorEnabled }),
                                    )
                                }
                            >
                                Local
                            </Button>
                            <Button
                                intent="neutral"
                                isDisabled={isRelayUrlLoading}
                                onClick={() => onRelayUrlPresetClick('')}
                            >
                                Reset
                            </Button>
                        </ButtonGroup>
                    </Column>
                </ActionColumn>
            </SectionItem>
            <WipeSuiteSyncLabels onError={onError} />
            <SuiteSyncSettingsDebug />
        </SettingsSection>
    );
};
