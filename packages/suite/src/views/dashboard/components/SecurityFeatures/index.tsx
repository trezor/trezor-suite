import React from 'react';
import styled from 'styled-components';

import { Button, SecurityCard, SecurityCardProps, variables } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { Section } from 'src/components/dashboard';
import { AcquiredDevice } from 'src/types/suite';
import { useDevice, useDiscovery, useActions, useSelector } from 'src/hooks/suite';
import * as walletSettingsActions from 'src/actions/settings/walletSettingsActions';
import * as suiteActions from 'src/actions/suite/suiteActions';
import * as deviceSettingsActions from 'src/actions/settings/deviceSettingsActions';
import * as routerActions from 'src/actions/suite/routerActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';

const Content = styled.div`
    display: grid;
    grid-gap: 20px;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));

    @media only screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        grid-template-columns: 1fr 1fr;
    }
    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }
`;

const SecurityFeatures = () => {
    const { setDiscreetMode, createDeviceInstance, changePin, applySettings, goto, setFlag } =
        useActions({
            setDiscreetMode: walletSettingsActions.setDiscreetMode,
            createDeviceInstance: suiteActions.createDeviceInstance,
            changePin: deviceSettingsActions.changePin,
            applySettings: deviceSettingsActions.applySettings,
            goto: routerActions.goto,
            setFlag: suiteActions.setFlag,
        });
    const { discreetMode, device, flags } = useSelector(state => ({
        discreetMode: state.wallet.settings.discreetMode,
        device: state.suite.device,
        flags: state.suite.flags,
    }));

    const { isLocked } = useDevice();
    const isDeviceLocked = isLocked();
    const { getDiscoveryStatus } = useDiscovery();
    const discoveryStatus = getDiscoveryStatus();
    const isDisabledGlobal = discoveryStatus && discoveryStatus.status === 'loading';

    const { discreetModeCompleted, securityStepsHidden } = flags;
    let needsBackup;
    let pinEnabled;
    let hiddenWalletCreated;
    let backupFailed;

    if (device && device.features) {
        // TODO: add "error - backup failed" instead of needsBackup
        // TODO: add "enable passphrase" instead of hiddenWalletCreated
        needsBackup = device.features.needs_backup || device.features.unfinished_backup;
        pinEnabled = device.features.pin_protection;
        hiddenWalletCreated = device.features.passphrase_protection;
        backupFailed = device.features.unfinished_backup;
    }

    const featuresCompleted =
        Number(!needsBackup) +
        Number(!!pinEnabled) +
        Number(!!discreetModeCompleted) +
        Number(!!hiddenWalletCreated);

    const backupData: SecurityCardProps = needsBackup
        ? {
              variant: 'primary',
              icon: 'BACKUP',
              heading: <Translation id="TR_BACKUP_YOUR_DEVICE" />,
              description: <Translation id="TR_RECOVERY_SEED_IS_OFFLINE" />,
              cta: {
                  label: <Translation id="TR_BACKUP_NOW" />,
                  dataTest: 'backup',
                  action: () => goto('backup-index'),
                  isDisabled: !!backupFailed,
              },
          }
        : {
              variant: 'secondary',
              icon: 'BACKUP',
              heading: <Translation id="TR_BACKUP_SEED_CREATED_SUCCESSFULLY" />,
              cta: {
                  label: <Translation id="TR_CHECK_SEED_IN_SETTINGS" />,
                  dataTest: 'seed-link',
                  action: () =>
                      goto('settings-device', { anchor: SettingsAnchor.CheckRecoverySeed }),
              },
          };

    const pinData: SecurityCardProps = !pinEnabled
        ? {
              variant: 'primary',
              icon: 'PIN',
              heading: <Translation id="TR_PIN" />,
              description: <Translation id="TR_SET_STRONG_PIN_NUMBER_AGAINST" />,
              cta: {
                  label: <Translation id="TR_ENABLE_PIN" />,
                  dataTest: 'pin',
                  action: () => changePin({}),
                  isDisabled: isDeviceLocked,
              },
          }
        : {
              variant: 'secondary',
              icon: 'PIN',
              heading: <Translation id="TR_DEVICE_PIN_PROTECTION_ENABLED" />,
              cta: {
                  label: <Translation id="TR_CHANGE_PIN_IN_SETTINGS" />,
                  dataTest: 'pin-link',
                  action: () => goto('settings-device', { anchor: SettingsAnchor.ChangePin }),
              },
          };

    const hiddenWalletData: SecurityCardProps = !hiddenWalletCreated
        ? {
              variant: 'primary',
              icon: 'WALLET_HIDDEN',
              heading: <Translation id="TR_PASSPHRASE_PROTECTION" />,
              description: <Translation id="TR_ENABLE_PASSPHRASE_DESCRIPTION" />,
              cta: {
                  label: <Translation id="TR_ENABLE_PASSPHRASE" />,
                  action: () =>
                      applySettings({
                          use_passphrase: true,
                      }),
                  dataTest: 'hidden-wallet',
                  isDisabled: isDeviceLocked,
              },
          }
        : {
              variant: 'secondary',
              icon: 'WALLET_HIDDEN',
              heading: <Translation id="TR_PASSPHRASE_PROTECTION_ENABLED" />,
              cta: {
                  label: <Translation id="TR_CREATE_HIDDEN_WALLET" />,
                  action: () => createDeviceInstance(device as AcquiredDevice),
                  dataTest: 'create-hidden-wallet',
                  isDisabled: isDeviceLocked,
              },
          };

    const discreetModeData: SecurityCardProps = !discreetModeCompleted
        ? {
              variant: 'primary',
              icon: 'DISCREET',
              heading: <Translation id="TR_DISCREET_MODE" />,
              description: <Translation id="TR_TRY_TO_TEMPORARILY_HIDE" />,
              cta: {
                  label: <Translation id="TR_TRY_DISCREET_MODE" />,
                  action: () => setDiscreetMode(true),
                  dataTest: 'discreet',
              },
          }
        : {
              variant: 'secondary',
              icon: 'DISCREET',
              heading: <Translation id="TR_DISCREET_MODE_TRIED_OUT" />,
              cta: {
                  label: discreetMode ? (
                      <Translation id="TR_DISABLE_DISCREET_MODE" />
                  ) : (
                      <Translation id="TR_ENABLE_DISCREET_MODE" />
                  ),
                  action: () => setDiscreetMode(!discreetMode),
                  dataTest: 'toggle-discreet',
              },
          };

    const cards: SecurityCardProps[] = [backupData, pinData, hiddenWalletData, discreetModeData];

    return (
        <Section
            heading={
                <Translation
                    id="TR_SECURITY_FEATURES_COMPLETED_N"
                    values={{ n: featuresCompleted, m: 4 }}
                />
            }
            actions={
                <Button
                    variant="tertiary"
                    icon={securityStepsHidden ? 'ARROW_DOWN' : 'ARROW_UP'}
                    onClick={() => setFlag('securityStepsHidden', !securityStepsHidden)}
                >
                    {securityStepsHidden ? (
                        <Translation id="TR_SHOW_BUTTON" />
                    ) : (
                        <Translation id="TR_HIDE_BUTTON" />
                    )}
                </Button>
            }
        >
            <Content>
                {!securityStepsHidden &&
                    cards.map((card, i) => {
                        // re-check if the card button should be disabled (taking the global loading state into account)
                        const ctaObject = card.cta
                            ? { ...card.cta, isDisabled: !!isDisabledGlobal || card.cta.isDisabled }
                            : undefined;

                        return (
                            <SecurityCard
                                // eslint-disable-next-line react/no-array-index-key
                                key={`${i}`}
                                variant={card.variant}
                                icon={card.icon}
                                heading={card.heading}
                                description={card.description}
                                cta={ctaObject}
                            />
                        );
                    })}
            </Content>
        </Section>
    );
};

export default SecurityFeatures;
