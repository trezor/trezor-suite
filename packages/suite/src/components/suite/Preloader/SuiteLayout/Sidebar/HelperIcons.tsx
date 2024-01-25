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
    border-right: 1px solid ${({ theme }) => theme.borderOnElevation0};
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

const EapIcon = styled(HelperIcon)<{ isEapEnabled: boolean }>`
    background-color: ${({ theme, isEapEnabled }) =>
        isEapEnabled ? '#8247E5' : theme.backgroundAlertYellowBold};

    :hover {
        background-color: ${({ theme, isEapEnabled }) =>
            isEapEnabled ? '#551ab8' : theme.iconAlertYellow};
    }
`;

const DebugModeIcon = styled(HelperIcon)`
    background-color: ${({ theme }) => theme.backgroundAlertRedBold};
`;

export const HelperIcons = () => {
    const isEapEnabled = useSelector(state => state.desktopUpdate.allowPrerelease);
    const allowPrerelease = useSelector(state => state.desktopUpdate.allowPrerelease);
    const showDebugMode = useSelector(state => state.suite.settings.debug.showDebugMenu);
    const { translationString } = useTranslation();
    const dispatch = useDispatch();
    const theme = useTheme();

    const handleEapClick = () => {
        dispatch(goto('settings-index', { anchor: SettingsAnchor.EarlyAccess }));
    };

    if (!allowPrerelease && !showDebugMode) return null;

    return (
        <Container>
            {allowPrerelease && (
                <EapIcon onClick={handleEapClick} isEapEnabled={isEapEnabled}>
                    <Tooltip cursor="pointer" content={translationString('TR_EARLY_ACCESS')}>
                        <Icon icon="EXPERIMENTAL" size={16} color={theme.iconOnSecondary} />
                    </Tooltip>
                </EapIcon>
            )}
            {showDebugMode && (
                <DebugModeIcon>
                    <Tooltip content="Debug mode active">
                        <Icon icon="FLAG" size={16} color={theme.iconOnSecondary} />
                    </Tooltip>
                </DebugModeIcon>
            )}
        </Container>
    );
};
