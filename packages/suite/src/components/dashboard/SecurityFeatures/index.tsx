import React, { useState } from 'react';
import styled from 'styled-components';
import { colors, Button } from '@trezor/components-v2';
import SecurityCard, { Props as CardProps } from './components/SecurityCard';
import { Props } from './Container';
import { AcquiredDevice } from '@suite/types/suite';

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
    discreetMode,
    setDiscreetMode,
    createDeviceInstance,
    goto,
    changePin,
    ...rest
}: Props) => {
    const [isHidden, setIsHidden] = useState(false);

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
        Number(discreetMode) +
        Number(hiddenWalletCreated);

    const backupData: CardProps = needsBackup
        ? {
              variant: 'secondary',
              icon: 'SIGN',
              heading: 'Backup your device',
              description: 'Recovery seed is an offline backup of your device',
              cta: {
                  label: 'Backup now',
                  action: () => {
                      goto('backup-index');
                  },
              },
          }
        : {
              variant: 'primary',
              icon: 'CHECK',
              heading: 'Recovery seed created!',
          };

    const pinData: CardProps = !pinEnabled
        ? {
              variant: 'secondary',
              icon: 'WALLET',
              heading: 'Enable PIN',
              description: 'Set strong PIN number against unauthorized access',
              cta: {
                  label: 'Enable',
                  action: () => {
                      changePin({});
                  },
              },
          }
        : {
              variant: 'primary',
              icon: 'CHECK',
              heading: 'Device protected by PIN!',
          };

    const hiddenWalletData: CardProps = !hiddenWalletCreated
        ? {
              variant: 'secondary',
              icon: 'WALLET',
              heading: 'Hidden Wallet',
              description: 'Create a Wallet hidden behind a strong passphrase',
              cta: {
                  label: 'Create hidden wallet',
                  action: () => createDeviceInstance(device as AcquiredDevice),
              },
          }
        : {
              variant: 'primary',
              icon: 'CHECK',
              heading: 'Passphrase protection enabled!',
          };

    const discreetModeData: CardProps = !discreetMode
        ? {
              variant: 'secondary',
              icon: 'WALLET',
              heading: 'Discreet mode',
              description: 'Try to temporarily hide away all balance-related numbers',
              cta: {
                  label: 'Try Discreet mode',
                  action: () => setDiscreetMode(true),
              },
          }
        : {
              variant: 'primary',
              icon: 'CHECK',
              heading: 'Discreet mode enabled!',
              cta: {
                  label: 'Disable discreet mode',
                  action: () => setDiscreetMode(false),
              },
          };

    const cards = [backupData, pinData, hiddenWalletData, discreetModeData];
    const dataTest = ['backup', 'pin', 'hidden-wallet', 'discreet'];

    return (
        <Section {...rest}>
            <SectionHeader>
                <SectionTitle>Security Features (Completed {featuresCompleted} of 4)</SectionTitle>
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
                            key={dataTest[i]}
                            variant={isDisabled ? 'disabled' : card.variant}
                            // variant="disabled"
                            icon={card.icon}
                            heading={card.heading}
                            description={card.description}
                            cta={card.cta}
                            data-test={dataTest[i]}
                        />
                    ))}
            </Content>
        </Section>
    );
};

export default SecurityFeatures;
