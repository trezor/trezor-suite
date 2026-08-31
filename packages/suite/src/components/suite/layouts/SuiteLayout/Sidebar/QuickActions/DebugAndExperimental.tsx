import { useDispatch } from 'react-redux';

import { selectIsDebugModeActive } from '@suite/debug';
import { Translation } from '@suite/intl';
import { SettingsAnchor, goto } from '@suite/router';
import { selectIsExperimentalEnabled } from '@suite/settings';
import { Box, Column, Icon } from '@trezor/components';
import { AtomIcon, CheckIcon, DotOutlineFilledIcon, StarFourIcon } from '@trezor/icons';
import { QuickActionButton, TooltipRow } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

type DebugAndExperimentalTooltipProps = {
    isDebugMode: boolean;
    isEapEnabled: boolean;
    isExperimental: boolean;
};

const DebugAndExperimentalTooltip = ({
    isDebugMode,
    isEapEnabled,
    isExperimental,
}: DebugAndExperimentalTooltipProps) => (
    <Column gap={16} padding={4} alignItems="start">
        {isExperimental && (
            <TooltipRow
                icon={CheckIcon}
                intent="brand"
                header={<Translation id="TR_EXPERIMENTAL_FEATURES_ALLOW" />}
                leftItem={<Icon as={AtomIcon} intent="warning" size={16} />}
            >
                <Translation id="TR_QUICK_ACTION_DEBUG_EAP_EXPERIMENTAL_ENABLED" />
            </TooltipRow>
        )}
        {isEapEnabled && (
            <TooltipRow
                icon={CheckIcon}
                intent="brand"
                header={<Translation id="TR_EARLY_ACCESS" />}
                leftItem={<Icon as={StarFourIcon} intent="info" size={16} />}
            >
                <Translation id="TR_QUICK_ACTION_DEBUG_EAP_EXPERIMENTAL_ENABLED" />
            </TooltipRow>
        )}
        {isDebugMode && (
            <TooltipRow
                icon={CheckIcon}
                intent="brand"
                header="Debug Mode"
                leftItem={<Icon as={DotOutlineFilledIcon} intent="critical" size={16} />}
            >
                <Translation id="TR_QUICK_ACTION_DEBUG_EAP_EXPERIMENTAL_ENABLED" />
            </TooltipRow>
        )}
    </Column>
);

export const DebugAndExperimental = () => {
    const dispatch = useDispatch();

    const isEapEnabled = useSelector(state => state.desktopUpdate.allowPrerelease);
    const isExperimental = useSelector(selectIsExperimentalEnabled);
    const isDebug = useSelector(selectIsDebugModeActive);
    const position = { type: 'absolute', top: 0, left: 0 } as const;

    const handleEapClick = () => {
        dispatch(goto({ routeName: 'settings-index', anchor: SettingsAnchor.EarlyAccess }));
    };

    if (!isEapEnabled && !isExperimental && !isDebug) return null;

    return (
        <QuickActionButton
            tooltip={{
                content: (
                    <DebugAndExperimentalTooltip
                        isDebugMode={isDebug}
                        isEapEnabled={isEapEnabled}
                        isExperimental={isExperimental}
                    />
                ),
            }}
            onClick={handleEapClick}
            iconComponent={
                <Box position={{ type: 'relative' }} width={16} height={16}>
                    {isDebug && (
                        <Box position={position}>
                            <Icon as={DotOutlineFilledIcon} intent="critical" size={16} />
                        </Box>
                    )}
                    {isExperimental && (
                        <Box position={position}>
                            <Icon as={AtomIcon} intent="warning" size={16} />
                        </Box>
                    )}
                    {isEapEnabled && (
                        <Box position={position}>
                            <Icon as={StarFourIcon} intent="info" size={16} />
                        </Box>
                    )}
                </Box>
            }
        />
    );
};
