import { Column, IconButton, variables } from '@trezor/components';
import { setDiscreetMode } from 'src/actions/settings/walletSettingsActions';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import { selectIsDiscreteModeActive } from 'src/reducers/wallet/settingsReducer';
import { TrafficLightOffset } from '../../TrafficLightOffset';
import styled from 'styled-components';
import { borders, spacingsPx } from '@trezor/theme';
import { Translation } from '../../Translation';
import { useCallback, useEffect, useState } from 'react';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { selectTorState } from 'src/reducers/suite/suiteReducer';
import { useLocation } from 'react-router-dom';
import { ButtonVariant } from '@trezor/components/src/components/buttons/buttonStyleUtils';
import { removeSettingsFromUrl } from './utils';
import { TorContainerWithCheckIcon } from '../SuiteLayout/Sidebar/TorContainerWithCheckIcon';

type ActivePage = 'trezor' | 'settings';

const WELCOME_SIDEBAR_WIDTH = 84;
const WELCOME_ICON_SIZE = 40;

const WelcomeWrapper = styled.div`
    background-color: ${({ theme }) => theme.backgroundSurfaceElevationNegative};
    border-right: 1px solid ${({ theme }) => theme.borderElevation0};

    @media (max-width: ${variables.SCREEN_SIZE.MD}) {
        display: none;
    }
`;

const LeftContainer = styled.div`
    padding: ${spacingsPx.xs};
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
`;

const LeftWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xs};
`;

type ExtraIconButtonProps = {
    variant: ButtonVariant;
    borderRadius: string;
    width: number;
    height: number;
};

const extraIconButtonProps = (): ExtraIconButtonProps => {
    return {
        variant: 'welcome',
        borderRadius: borders.radii.sm,
        width: WELCOME_ICON_SIZE,
        height: WELCOME_ICON_SIZE,
    };
};

export const WelcomeSidebar = () => {
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const isDiscreetModeActive = useSelector(selectIsDiscreteModeActive);
    const translationLabel = isDiscreetModeActive ? 'TR_SHOW_BALANCES' : 'TR_HIDE_BALANCES';
    const { isTorLoading } = useSelector(selectTorState);
    const [activePage, setActivePage] = useState<ActivePage>('trezor');
    const location = useLocation();

    const handleDiscreetModeClick = () => dispatch(setDiscreetMode(!isDiscreetModeActive));

    const handleClickTrezor = () => {
        setActivePage('trezor');
        dispatch(goto('suite-start'));
        const updatedUrl = removeSettingsFromUrl(window.location.pathname);
        window.location.pathname = updatedUrl;
        location.pathname = removeSettingsFromUrl(location.pathname);
    };

    const handleClickSettings = useCallback(() => {
        setActivePage('settings');
        dispatch(goto('settings-index'));
    }, [dispatch]);

    const handleClickTor = () => {
        setActivePage('settings');
        dispatch(
            goto('settings-index', {
                anchor: SettingsAnchor.Tor,
            }),
        );
    };

    useEffect(() => {
        if (
            window.location.pathname.includes('settings') ||
            location.pathname.includes('settings')
        ) {
            setActivePage('settings');
        }
    }, [location.pathname]);

    return (
        <WelcomeWrapper>
            <TrafficLightOffset>
                <Column
                    justifyContent="center"
                    alignItems="center"
                    height="100%"
                    width={WELCOME_SIDEBAR_WIDTH}
                >
                    <LeftContainer>
                        <LeftWrapper>
                            <IconButton
                                label={<Translation id="TR_CONNECT" />}
                                icon="TREZOR_LOGO"
                                isSubtle={activePage !== 'trezor'}
                                onClick={handleClickTrezor}
                                {...extraIconButtonProps()}
                            />
                            <IconButton
                                label={<Translation id="TR_SETTINGS" />}
                                icon="SETTINGS"
                                isSubtle={activePage !== 'settings'}
                                onClick={handleClickSettings}
                                {...extraIconButtonProps()}
                            />
                        </LeftWrapper>

                        <LeftWrapper>
                            <IconButton
                                label={translationString(translationLabel)}
                                icon={isDiscreetModeActive ? 'SHOW' : 'HIDE'}
                                onClick={handleDiscreetModeClick}
                                isSubtle
                                {...extraIconButtonProps()}
                            />
                            <TorContainerWithCheckIcon>
                                <IconButton
                                    label={translationString('TR_TOR')}
                                    icon="TOR"
                                    isLoading={isTorLoading}
                                    onClick={handleClickTor}
                                    isSubtle
                                    {...extraIconButtonProps()}
                                />
                            </TorContainerWithCheckIcon>
                        </LeftWrapper>
                    </LeftContainer>
                </Column>
            </TrafficLightOffset>
        </WelcomeWrapper>
    );
};
