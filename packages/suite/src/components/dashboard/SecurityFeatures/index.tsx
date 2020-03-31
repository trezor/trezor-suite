import React, { useState } from 'react';
import styled from 'styled-components';
import { colors, Button } from '@trezor/components';
import { Translation } from '@suite-components';
import SecurityCard, { Props as CardProps } from './components/SecurityCard';
import { Props } from './Container';
import { AcquiredDevice } from '@suite/types/suite';
import { useTrezorActionEnabled } from '@suite-utils/hooks';

const Section = styled.div`
    display: flex;
    flex-direction: column;
`;

const Content = styled.div`
    display: flex;
`;

const SectionHeader = styled.div`
    display: flex;
    padding: 12px 0px;
    flex-direction: row;
    font-size: 12px;
    align-items: center;
`;

const SectionTitle = styled.div`
    flex: 1;
    margin-bottom: 2px;
    font-weight: 600;
    text-transform: uppercase;
    color: ${colors.BLACK50};
`;

const SectionAction = styled.div`
    font-weight: 500;
    color: ${colors.BLACK25};
`;

const SecurityFeatures = ({
    device,
    isDisabled,
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
    const [isTrezorActionEnabled, status] = useTrezorActionEnabled();

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
        Number(pinEnabled) +
        Number(discreetModeCompleted) +
        Number(hiddenWalletCreated);

    const backupData: CardProps = needsBackup
        ? {
              variant: 'secondary',
              icon: 'SIGN',
              heading: <Translation id="TR_BACKUP_YOUR_DEVICE" />,
              description: <Translation id="TR_RECOVERY_SEED_IS_OFFLINE" />,
              cta: {
                  label: <Translation id="TR_BACKUP_NOW" />,
                  dataTest: 'backup',
                  action: () => {
                      goto('backup-index');
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
                  },
              },
          };

    const pinData: CardProps = !pinEnabled
        ? {
              variant: 'secondary',
              icon: 'WALLET',
              heading: <Translation id="TR_ENABLE_PIN" />,
              description: <Translation id="TR_SET_STRONG_PIN_NUMBER_AGAINST" />,
              cta: {
                  label: 'Enable',
                  dataTest: 'pin',
                  action: () => {
                      changePin({});
                  },
                  isDisabled: !isTrezorActionEnabled,
              },
          }
        : {
              variant: 'primary',
              icon: 'CHECK',
              heading: <Translation id="TR_DEVICE_PROTECTED_BY_PIN!" />,
              cta: {
                  label: <Translation id="TR_CHANGE_PIN_IN_SETTINGS" />,
                  dataTest: 'pin-link',
                  action: () => {
                      goto('settings-device');
                  },
              },
          };

    const hiddenWalletData: CardProps = !hiddenWalletCreated
        ? {
              variant: 'secondary',
              icon: 'WALLET',
              heading: <Translation id="TR_PASSPHRASE" />,
              description: <Translation id="TR_ENABLE_PASSPHRASE_DESCRIPTION" />,
              cta: {
                  label: <Translation id="TR_ENABLE_PASSPHRASE" />,
                  action: () =>
                      applySettings({
                          // eslint-disable-next-line @typescript-eslint/camelcase
                          use_passphrase: true,
                      }),
                  dataTest: 'hidden-wallet',
                  isDisabled: !isTrezorActionEnabled,
              },
          }
        : {
              variant: 'primary',
              icon: 'CHECK',
              heading: <Translation id="TR_PASSPHRASE_PROTECTION_ENABLED" />,
              cta: {
                  label: <Translation id="TR_CREATE_HIDDEN_WALLET" />,
                  action: () => createDeviceInstance(device as AcquiredDevice),
                  dataTest: 'create-hidden-wallet',
                  isDisabled: !isTrezorActionEnabled,
              },
          };

    const discreetModeData: CardProps = !discreetModeCompleted
        ? {
              variant: 'secondary',
              icon: 'WALLET',
              heading: <Translation id="TR_DISCREET_MODE" />,
              description: <Translation id="TR_TRY_TO_TEMPORARILY_HIDE" />,
              cta: {
                  label: <Translation id="TR_TRY_DISCREET_MODE" />,
                  action: () => setDiscreetMode(true),
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
                  action: () => setDiscreetMode(!discreetMode),
                  dataTest: 'toggle-discreet',
              },
          };

    const cards = [backupData, pinData, hiddenWalletData, discreetModeData];

    return (
        <Section {...rest}>
            <SectionHeader>
                <SectionTitle>
                    <Translation
                        id="TR_SECURITY_FEATURES_COMPLETED_N"
                        values={{ n: featuresCompleted, m: 4 }}
                    />
                </SectionTitle>
                <SectionAction>
                    <Button
                        variant="tertiary"
                        size="small"
                        icon={isHidden ? 'ARROW_DOWN' : 'ARROW_UP'}
                        onClick={() => {
                            setIsHidden(!isHidden);
                        }}
                    >
                        {isHidden ? 'Show' : 'Hide'}
                    </Button>
                </SectionAction>
            </SectionHeader>
            <Content>
                {!isHidden &&
                    cards.map((card, i) => (
                        <SecurityCard
                            // eslint-disable-next-line react/no-array-index-key
                            key={i}
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
