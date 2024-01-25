import styled, { useTheme } from 'styled-components';
import { Icon, Tooltip } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { borders, spacingsPx, typography } from '@trezor/theme';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { selectTorState } from 'src/reducers/suite/suiteReducer';
import { setDiscreetMode } from 'src/actions/settings/walletSettingsActions';
import { selectIsDiscreteModeActive } from 'src/reducers/wallet/settingsReducer';
import { NavigationItemBase } from './NavigationItem';
import { ActionButton } from './ActionButton';
import { NavBackends } from './NavBackends';
import { HelperIcons } from './HelperIcons';
import { useEnabledBackends } from '../utils';

const Container = styled.div`
    display: flex;
    border-top: 1px solid ${({ theme }) => theme.borderOnElevation0};
`;

const DescreetContainer = styled(NavigationItemBase)`
    width: 100%;

    :hover {
        background: ${({ theme }) => theme.backgroundTertiaryPressedOnElevation0};
    }
`;

const ActionsContainer = styled.div`
    flex: 1;
    position: relative;
    display: flex;
    gap: ${spacingsPx.xxs};
    padding: ${spacingsPx.xxs};
    align-items: stretch;

    > * {
        flex: 1;
    }
`;

const Label = styled.span`
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
`;

const StyledCheckIcon = styled(Icon)`
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
        ${StyledCheckIcon} {
            background-color: ${({ theme }) => theme.backgroundTertiaryPressedOnElevation0};
        }
    }
`;

export const QuickActions = () => {
    const isDiscreetModeActive = useSelector(selectIsDiscreteModeActive);
    const { isTorEnabled, isTorLoading } = useSelector(selectTorState);
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const theme = useTheme();
    const handleDiscreetModeClick = () => dispatch(setDiscreetMode(!isDiscreetModeActive));
    const enabledBackends = useEnabledBackends();
    const translationLabel = isDiscreetModeActive ? 'TR_SHOW_BALANCES' : 'TR_HIDE_BALANCES';
    const isCustomBackendIconVisible = enabledBackends.length > 0;
    const isTorIconVisible = isDesktop();

    const CheckIcon = () => (
        <StyledCheckIcon icon="CHECK_ACTIVE" size={12} color={theme.iconPrimaryDefault} />
    );

    return (
        <Container>
            <HelperIcons />
            <ActionsContainer>
                {!isCustomBackendIconVisible && !isTorIconVisible ? (
                    <DescreetContainer onClick={handleDiscreetModeClick}>
                        <Icon size={16} icon={isDiscreetModeActive ? 'HIDE' : 'SHOW'} />
                        <Label>{translationString(translationLabel)} </Label>
                    </DescreetContainer>
                ) : (
                    <>
                        {isCustomBackendIconVisible && (
                            <Tooltip
                                content={translationString('TR_CUSTOM_BACKEND')}
                                cursor="pointer"
                            >
                                <>
                                    <NavBackends customBackends={enabledBackends} />
                                    <CheckIcon />
                                </>
                            </Tooltip>
                        )}
                        {isTorIconVisible && (
                            <TorToggleContainer>
                                <ActionButton
                                    icon="TOR"
                                    title={translationString('TR_TOR')}
                                    isLoading={isTorLoading}
                                    onClick={() =>
                                        dispatch(
                                            goto('settings-index', { anchor: SettingsAnchor.Tor }),
                                        )
                                    }
                                    size="small"
                                    variant="tertiary"
                                />

                                {isTorEnabled && <CheckIcon />}
                            </TorToggleContainer>
                        )}

                        <ActionButton
                            title={translationString(translationLabel)}
                            icon={isDiscreetModeActive ? 'HIDE' : 'SHOW'}
                            onClick={handleDiscreetModeClick}
                            variant="tertiary"
                            size="small"
                        />
                    </>
                )}
            </ActionsContainer>
        </Container>
    );
};
