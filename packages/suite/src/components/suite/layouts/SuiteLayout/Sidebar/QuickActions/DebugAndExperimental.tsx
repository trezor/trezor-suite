import { Column, getIconSize, Icon, iconSizes } from '@trezor/components';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { QuickActionButton } from './QuickActionButton';
import styled from 'styled-components';
import { TooltipRow } from './TooltipRow';
import { spacings } from '@trezor/theme';
import { Translation } from '../../../../Translation';

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
    <Column gap={spacings.md} alignItems="start">
        {isExperimental && (
            <TooltipRow
                circleIconName="check"
                variant="primary"
                header={<Translation id="TR_EARLY_ACCESS" />}
                leftItem={<Icon name="experimental" variant="purple" size={iconSizes.medium} />}
            >
                <Translation id="TR_QUICK_ACTION_DEBUG_EAP_EXPERIMENTAL_ENABLED" />
            </TooltipRow>
        )}
        {isEapEnabled && (
            <TooltipRow
                circleIconName="check"
                variant="primary"
                header={<Translation id="TR_EXPERIMENTAL_FEATURES_ALLOW" />}
                leftItem={<Icon name="eap" variant="warning" size={iconSizes.medium} />}
            >
                <Translation id="TR_QUICK_ACTION_DEBUG_EAP_EXPERIMENTAL_ENABLED" />
            </TooltipRow>
        )}
        {isDebugMode && (
            <TooltipRow
                circleIconName="check"
                variant="primary"
                header="Debug Mode"
                leftItem={<Icon name="debug" variant="destructive" size={iconSizes.medium} />}
            >
                <Translation id="TR_QUICK_ACTION_DEBUG_EAP_EXPERIMENTAL_ENABLED" />
            </TooltipRow>
        )}
    </Column>
);

const Relative = styled.div<{ $size: number }>`
    position: relative;
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
`;

const Absolute = styled.div`
    position: absolute;
    top: 0;
    left: 0;
`;

export const DebugAndExperimental = () => {
    const dispatch = useDispatch();

    const isEapEnabled = useSelector(state => state.desktopUpdate.allowPrerelease);
    const isExperimental = useSelector(state => state.suite.settings.experimental !== undefined);
    const isDebugMode = useSelector(state => state.suite.settings.debug.showDebugMenu);

    const handleEapClick = () => {
        dispatch(goto('settings-index', { anchor: SettingsAnchor.EarlyAccess }));
    };

    if (!isEapEnabled && !isExperimental && !isDebugMode) return null;

    return (
        <QuickActionButton
            tooltip={
                <DebugAndExperimentalTooltip
                    isDebugMode={isDebugMode}
                    isEapEnabled={isEapEnabled}
                    isExperimental={isExperimental}
                />
            }
            onClick={handleEapClick}
        >
            <Relative $size={getIconSize(iconSizes.medium)}>
                {isDebugMode && (
                    <Absolute>
                        <Icon name="debug" variant="destructive" size={iconSizes.medium} />
                    </Absolute>
                )}
                {isExperimental && (
                    <Absolute>
                        <Icon name="experimental" variant="purple" size={iconSizes.medium} />
                    </Absolute>
                )}
                {isEapEnabled && (
                    <Absolute>
                        <Icon name="eap" variant="warning" size={iconSizes.medium} />
                    </Absolute>
                )}
            </Relative>
        </QuickActionButton>
    );
};
