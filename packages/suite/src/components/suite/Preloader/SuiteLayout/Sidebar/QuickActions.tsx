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
import { useCustomBackends } from 'src/hooks/settings/backends';
import { ActionButton } from './ActionButton';
import { NavBackends } from './NavBackends';

const DescreetContainer = styled(NavigationItemBase)`
    width: 100%;

    :hover {
        background: ${({ theme }) => theme.backgroundTertiaryPressedOnElevation0};
    }
`;

const ActionsContainer = styled.div<{ numberOfColumns: number }>`
    position: relative;
    display: grid;
    grid-template-columns: ${({ numberOfColumns }) => '1fr '.repeat(numberOfColumns)};
    gap: ${spacingsPx.md};
    padding: ${spacingsPx.xs};
    border-top: 1px solid ${({ theme }) => theme.borderOnElevation0};
    align-items: stretch;
`;

const Column = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;

    &:not(:last-child)::after {
        background: ${({ theme }) => theme.borderOnElevation0};
        width: 1px;
        content: '';
        display: block;
        position: absolute;
        top: 0;
        bottom: 0;
        right: 0;
        height: 100%;
        margin-right: -9px;
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
    const enabledNetworks = useSelector(state => state.wallet.settings.enabledNetworks);

    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const theme = useTheme();

    const handleDicreetModeClick = () => dispatch(setDiscreetMode(!isDiscreetModeActive));
    const customBackends = useCustomBackends().filter(backend =>
        enabledNetworks.includes(backend.coin),
    );
    const translationLabel = isDiscreetModeActive ? 'TR_SHOW_BALANCES' : 'TR_HIDE_BALANCES';
    const isCustomBackendIconVisible = customBackends.length > 0;
    const isTorIconVisible = isDesktop();
    const numberOfColumns = [isCustomBackendIconVisible, isTorIconVisible, true].filter(
        Boolean,
    ).length;

    const CheckIcon = () => (
        <StyledCheckIcon icon="CHECK_ACTIVE" size={12} color={theme.iconPrimaryDefault} />
    );

    return (
        <ActionsContainer numberOfColumns={numberOfColumns}>
            {isCustomBackendIconVisible && (
                <Column>
                    <Tooltip content={translationString('TR_CUSTOM_BACKEND')} cursor="pointer">
                        <>
                            <NavBackends customBackends={customBackends} />

                            <CheckIcon />
                        </>
                    </Tooltip>
                </Column>
            )}
            {isTorIconVisible && (
                <Column>
                    <Tooltip content={translationString('TR_TOR')} cursor="pointer">
                        <TorToggleContainer>
                            <ActionButton
                                icon="TOR"
                                isLoading={isTorLoading}
                                onClick={() =>
                                    dispatch(goto('settings-index', { anchor: SettingsAnchor.Tor }))
                                }
                                size="small"
                                variant="tertiary"
                            />

                            {isTorEnabled && <CheckIcon />}
                        </TorToggleContainer>
                    </Tooltip>
                </Column>
            )}
            <Column>
                {numberOfColumns === 1 ? (
                    <DescreetContainer onClick={handleDicreetModeClick}>
                        <Icon size={16} icon={isDiscreetModeActive ? 'HIDE' : 'SHOW'} />
                        <Label>{translationString(translationLabel)} </Label>
                    </DescreetContainer>
                ) : (
                    <Tooltip content={translationString(translationLabel)} cursor="pointer">
                        <ActionButton
                            icon={isDiscreetModeActive ? 'HIDE' : 'SHOW'}
                            onClick={handleDicreetModeClick}
                            variant="tertiary"
                            size="small"
                        />
                    </Tooltip>
                )}
            </Column>
        </ActionsContainer>
    );
};
