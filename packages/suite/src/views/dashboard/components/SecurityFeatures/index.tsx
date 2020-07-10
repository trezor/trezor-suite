import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, SecurityCard, SecurityCardProps } from '@trezor/components';
import { Translation } from '@suite-components';
import { Props } from './Container';
import { AcquiredDevice } from '@suite-types';
import Header from '../Header';
import { useDevice, useDiscovery, useAnalytics } from '@suite-hooks';

const Section = styled.div`
    display: flex;
    flex-direction: column;
`;

const Content = styled.div`
    display: grid;
    grid-gap: 20px;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
`;

const SecurityFeatures = ({
    device,
    flags,
    discreetMode,
    setDiscreetMode,
    createDeviceInstance,
    applySettings,
    goto,
    changePin,
    ...rest
}: Props) => {
    const [isHidden, setIsHidden] = useState(false);
    const { isLocked } = useDevice();
    const isDeviceLocked = isLocked();
    const { getDiscoveryStatus } = useDiscovery();
    const discoveryStatus = getDiscoveryStatus();
    const isDisabled = discoveryStatus && discoveryStatus.status === 'loading';
    const analytics = useAnalytics();

    const { discreetModeCompleted } = flags;
    let needsBackup;
    let pinEnabled;
    let hiddenWalletCreated;

    if (device && device.features) {
        // TODO: add "error - backup failed" instead of needsBackup
        // TODO: add "enable passphrase" instead of hiddenWalletCreated
        needsBackup = device.features.needs_backup || device.features.unfinished_backup;
        pinEnabled = device.features.pin_protection;
        hiddenWalletCreated = device.features.passphrase_protection;
    }

    const featuresCompleted =
        Number(!needsBackup) +
        Number(!!pinEnabled) +
        Number(!!discreetModeCompleted) +
        Number(!!hiddenWalletCreated);

    const backupData = needsBackup
        ? {
              variant: 'secondary',
              icon: 'BACKUP',
              heading: <Translation id="TR_BACKUP_YOUR_DEVICE" />,
              description: <Translation id="TR_RECOVERY_SEED_IS_OFFLINE" />,
              cta: {
                  label: <Translation id="TR_BACKUP_NOW" />,
                  dataTest: 'backup',
                  action: () => {
                      goto('backup-index');
                      analytics.report({
                          type: 'dashboard/security-card/create-backup',
                      });
                  },
              },
          }
        : {
              variant: 'primary',
              icon: 'CHECK',
              heading: <Translation id="TR_BACKUP_SEED_CREATED_SUCCESSFULLY" />,
              cta: {
                  label: <Translation id="TR_CHECK_SEED_IN_SETTINGS" />,
                  dataTest: 'seed-link',
                  action: () => {
                      goto('settings-device');
                      analytics.report({
                          type: 'dashboard/security-card/seed-link',
                      });
                  },
              },
          };

    const pinData = !pinEnabled
        ? {
              variant: 'secondary',
              icon: 'PIN',
              heading: <Translation id="TR_PIN" />,
              description: <Translation id="TR_SET_STRONG_PIN_NUMBER_AGAINST" />,
              cta: {
                  label: <Translation id="TR_ENABLE_PIN" />,
                  dataTest: 'pin',
                  action: () => {
                      changePin({});
                      analytics.report({
                          type: 'dashboard/security-card/set-pin',
                      });
                  },
                  isDisabled: isDeviceLocked,
              },
          }
        : {
              variant: 'primary',
              icon: 'CHECK',
              heading: <Translation id="TR_DEVICE_PIN_PROTECTION_ENABLED" />,
              cta: {
                  label: <Translation id="TR_CHANGE_PIN_IN_SETTINGS" />,
                  dataTest: 'pin-link',
                  action: () => {
                      goto('settings-device');
                      analytics.report({
                          type: 'dashboard/security-card/change-pin',
                      });
                  },
              },
          };

    const hiddenWalletData = !hiddenWalletCreated
        ? {
              variant: 'secondary',
              icon: 'WALLET_HIDDEN',
              heading: <Translation id="TR_PASSPHRASE_PROTECTION" />,
              description: <Translation id="TR_ENABLE_PASSPHRASE_DESCRIPTION" />,
              cta: {
                  label: <Translation id="TR_ENABLE_PASSPHRASE" />,
                  action: () => {
                      applySettings({
                          // eslint-disable-next-line @typescript-eslint/camelcase
                          use_passphrase: true,
                      });
                      analytics.report({
                          type: 'dashboard/security-card/enable-passphrase',
                      });
                  },
                  dataTest: 'hidden-wallet',
                  isDisabled: isDeviceLocked,
              },
          }
        : {
              variant: 'primary',
              icon: 'CHECK',
              heading: <Translation id="TR_PASSPHRASE_PROTECTION_ENABLED" />,
              cta: {
                  label: <Translation id="TR_CREATE_HIDDEN_WALLET" />,
                  action: () => {
                      createDeviceInstance(device as AcquiredDevice);
                      analytics.report({
                          type: 'dashboard/security-card/create-hidden-wallet',
                      });
                  },
                  dataTest: 'create-hidden-wallet',
                  isDisabled: isDeviceLocked,
              },
          };

    const discreetModeData = !discreetModeCompleted
        ? {
              variant: 'secondary',
              icon: 'DISCREET',
              heading: <Translation id="TR_DISCREET_MODE" />,
              description: <Translation id="TR_TRY_TO_TEMPORARILY_HIDE" />,
              cta: {
                  label: <Translation id="TR_TRY_DISCREET_MODE" />,
                  action: () => {
                      setDiscreetMode(true);
                      analytics.report({
                          type: 'dashboard/security-card/enable-discreet',
                      });
                  },
                  dataTest: 'discreet',
              },
          }
        : {
              variant: 'primary',
              icon: 'CHECK',
              heading: <Translation id="TR_DISCREET_MODE_TRIED_OUT" />,
              cta: {
                  label: discreetMode ? (
                      <Translation id="TR_DISABLE_DISCREET_MODE" />
                  ) : (
                      <Translation id="TR_ENABLE_DISCREET_MODE" />
                  ),
                  action: () => {
                      setDiscreetMode(!discreetMode);
                      analytics.report({
                          type: 'dashboard/security-card/toggle-discreet',
                          payload: {
                              value: !discreetMode,
                          },
                      });
                  },
                  dataTest: 'toggle-discreet',
              },
          };

    const cards: SecurityCardProps[] = [backupData, pinData, hiddenWalletData, discreetModeData];

    return (
        <Section {...rest}>
            <Header
                left={
                    <Translation
                        id="TR_SECURITY_FEATURES_COMPLETED_N"
                        values={{ n: featuresCompleted, m: 4 }}
                    />
                }
                right={
                    <Button
                        variant="tertiary"
                        icon={isHidden ? 'ARROW_DOWN' : 'ARROW_UP'}
                        onClick={() => {
                            setIsHidden(!isHidden);
                        }}
                    >
                        {isHidden ? (
                            <Translation id="TR_SHOW_BUTTON" />
                        ) : (
                            <Translation id="TR_HIDE_BUTTON" />
                        )}
                    </Button>
                }
            />
            <Content>
                {!isHidden &&
                    cards.map(card => (
                        <SecurityCard
                            key={`${card.heading}-${card.variant}`}
                            variant={isDisabled ? 'disabled' : card.variant}
                            icon={card.icon}
                            heading={card.heading}
                            description={card.description}
                            cta={card.cta}
                        />
                    ))}
            </Content>
        </Section>
    );
};

export default SecurityFeatures;
