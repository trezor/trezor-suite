import styled, { useTheme } from 'styled-components';
import { Icon, Tooltip } from '@trezor/components';
import { borders, spacingsPx } from '@trezor/theme';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xxxs};
    justify-content: space-between;
    align-items: stretch;
    border-right: 1px solid ${({ theme }) => theme.borderElevation1};
    padding: ${spacingsPx.xxxs};
`;

const HelperIcon = styled.div`
    border-radius: ${borders.radii.xxxs};
    width: ${spacingsPx.lg};
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const ExperimentalIcon = styled(HelperIcon)<{ $isEapEnabled: boolean; $isExperimental: boolean }>`
    background: ${({ theme, $isEapEnabled, $isExperimental }) => {
        if (!$isExperimental) return '#7D4CE0';
        else if (!$isEapEnabled) return theme.backgroundAlertYellowBold;
        else return `linear-gradient(45deg, #7D4CE0, ${theme.backgroundAlertYellowBold})`;
    }};

    &:hover {
        background: ${({ theme, $isEapEnabled, $isExperimental }) => {
            if (!$isExperimental) return '#6e38dc';
            else if (!$isEapEnabled) return theme.iconAlertYellow;
            else return `linear-gradient(45deg, #6e38dc, ${theme.iconAlertYellow})`;
        }};
    }
`;

const DebugModeIcon = styled(HelperIcon)`
    background-color: ${({ theme }) => theme.backgroundAlertRedBold};
`;

export const HelperIcons = () => {
    const isEapEnabled = useSelector(state => state.desktopUpdate.allowPrerelease);
    const isExperimental = useSelector(state => !!state.suite.settings.experimental);
    const showExperimental = isEapEnabled || isExperimental;
    const showDebugMode = useSelector(state => state.suite.settings.debug.showDebugMenu);
    const { translationString } = useTranslation();
    const dispatch = useDispatch();
    const theme = useTheme();

    const handleEapClick = () => {
        dispatch(goto('settings-index', { anchor: SettingsAnchor.EarlyAccess }));
    };

    if (!showExperimental && !showDebugMode) return null;

    const experimentalTooltip = (
        <>
            {isEapEnabled && <p>{translationString('TR_EARLY_ACCESS')}</p>}
            {isExperimental && <p>{translationString('TR_EXPERIMENTAL_FEATURES')}</p>}
        </>
    );

    return (
        <Container>
            {showExperimental && (
                <ExperimentalIcon
                    onClick={handleEapClick}
                    $isEapEnabled={isEapEnabled}
                    $isExperimental={isExperimental}
                >
                    <Tooltip cursor="pointer" content={experimentalTooltip}>
                        <Icon name="experimental" size={16} color={theme.iconOnSecondary} />
                    </Tooltip>
                </ExperimentalIcon>
            )}
            {showDebugMode && (
                <DebugModeIcon>
                    <Tooltip content="Debug mode active">
                        <Icon name="experimental" size={16} color={theme.iconOnSecondary} />
                    </Tooltip>
                </DebugModeIcon>
            )}
        </Container>
    );
};
