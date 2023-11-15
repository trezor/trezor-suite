import styled, { useTheme } from 'styled-components';
import { Icon, IconButton } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { borders, spacingsPx, typography } from '@trezor/theme';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { selectTorState } from 'src/reducers/suite/suiteReducer';
import { setDiscreetMode } from 'src/actions/settings/walletSettingsActions';
import { NavigationItemBase } from './NavigationItem';

const WebContainer = styled.div`
    display: flex;
    align-items: center;
    margin-top: ${spacingsPx.sm};
    padding-top: ${spacingsPx.xs};
`;

const DescreetContainer = styled(NavigationItemBase)`
    width: 100%;

    :hover {
        background: ${({ theme }) => theme.backgroundTertiaryPressedOnElevation0};
    }
`;

const DesktopContainer = styled(WebContainer)`
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${spacingsPx.md};
    border-top: 1px solid ${({ theme }) => theme.borderOnElevation0};

    ::after {
        content: '';
        position: absolute;
        top: ${spacingsPx.xxs};
        right: 50%;
        width: 1px;
        height: 100%;
        background: ${({ theme }) => theme.borderOnElevation0};
    }
`;

const ActionButton = styled(IconButton)`
    width: 100%;
    border-radius: ${borders.radii.sm};
`;

const Label = styled.span`
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
`;

const ActiveTorIcon = styled(Icon)`
    position: absolute;
    bottom: 50%;
    left: 50%;
    background: ${({ theme }) => theme.backgroundSurfaceElevationNegative};
    border-radius: ${borders.radii.full};
`;

const TorToggleContainer = styled.div`
    position: relative;
    width: 100%;

    :hover,
    :focus-within {
        ${ActiveTorIcon} {
            background-color: ${({ theme }) => theme.backgroundTertiaryPressedOnElevation0};
        }
    }
`;

export const QuickActions = () => {
    const isDiscreetModeActive = useSelector(state => state.wallet.settings.discreetMode);
    const { isTorEnabled, isTorLoading } = useSelector(selectTorState);

    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const theme = useTheme();

    const isDesktopp = isDesktop();

    const handleDicreetModeClick = () => dispatch(setDiscreetMode(!isDiscreetModeActive));

    if (!isDesktopp) {
        const translationLabel = isDiscreetModeActive ? 'TR_SHOW_BALANCES' : 'TR_HIDE_BALANCES';

        return (
            <WebContainer onClick={handleDicreetModeClick}>
                <DescreetContainer>
                    <Icon size={16} icon={isDiscreetModeActive ? 'HIDE' : 'SHOW'} />
                    <Label>{translationString(translationLabel)} </Label>
                </DescreetContainer>
            </WebContainer>
        );
    }

    return (
        <DesktopContainer>
            <TorToggleContainer>
                <ActionButton
                    icon="TOR"
                    isLoading={isTorLoading}
                    onClick={() => dispatch(goto('settings-index', { anchor: SettingsAnchor.Tor }))}
                    size="small"
                    variant="tertiary"
                />

                {isTorEnabled && (
                    <ActiveTorIcon icon="CHECK_ACTIVE" size={12} color={theme.iconPrimaryDefault} />
                )}
            </TorToggleContainer>

            <ActionButton
                icon={isDiscreetModeActive ? 'HIDE' : 'SHOW'}
                onClick={handleDicreetModeClick}
                variant="tertiary"
                size="small"
            />
        </DesktopContainer>
    );
};
