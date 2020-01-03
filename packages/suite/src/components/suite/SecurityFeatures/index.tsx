import React, { useState } from 'react';
import styled from 'styled-components';
import { colors, Button } from '@trezor/components-v2';
import SecurityCard from './components/SecurityCard';
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
    discreetMode,
    setDiscreetMode,
    onCreateDeviceInstance,
    backupDevice,
    changePin,
    ...rest
}: Props) => {
    const [isHidden, setIsHidden] = useState(false);

    if (!device) return null;
    const needsBackup = device.features && device.features.needs_backup;
    const pinEnabled = device.features && device.features.pin_protection;
    const hiddenWalletCreated = false;
    const featuresCompleted =
        Number(!needsBackup) +
        Number(pinEnabled) +
        Number(discreetMode) +
        Number(hiddenWalletCreated);

    const cards = (
        <>
            {needsBackup ? (
                <SecurityCard
                    variant="secondary"
                    icon="SIGN"
                    heading="Backup your device"
                    description="Blabla bla why is backup important"
                    cta={{
                        label: 'Backup now',
                        action: () => {
                            backupDevice({});
                        },
                    }}
                />
            ) : (
                <SecurityCard
                    variant="primary"
                    icon="CHECK"
                    heading="Backup seed created successfully!"
                    cta={{ label: 'Done' }}
                />
            )}

            {pinEnabled ? (
                <SecurityCard
                    variant="primary"
                    icon="CHECK"
                    heading="Pin set!"
                    description="Pin code set successfully"
                    cta={{ label: 'Done' }}
                />
            ) : (
                <SecurityCard
                    variant="secondary"
                    icon="WALLET"
                    heading="Pin Code"
                    description="Set strong PIN number against unauthorized access"
                    cta={{
                        label: 'Set PIN',
                        action: () => {
                            changePin({});
                        },
                    }}
                />
            )}

            {hiddenWalletCreated ? (
                <SecurityCard
                    variant="primary"
                    icon="CHECK"
                    heading="Hidden Wallet successfully created"
                    cta={{ label: 'Done', action: () => {} }}
                />
            ) : (
                <SecurityCard
                    variant="secondary"
                    icon="WALLET"
                    heading="Hidden Wallet"
                    description="Create a Wallet hidden behind a strong passphrase"
                    cta={{
                        label: 'Create hidden wallet',
                        action: () => {
                            onCreateDeviceInstance(device as AcquiredDevice);
                        },
                    }}
                />
            )}

            {discreetMode ? (
                <SecurityCard
                    variant="primary"
                    icon="CHECK"
                    heading="Discreet mode enabled!"
                    cta={{
                        label: 'Done',
                        action: () => {
                            setDiscreetMode(false);
                        },
                    }}
                />
            ) : (
                <SecurityCard
                    variant="secondary"
                    icon="WALLET"
                    heading="Discreet mode"
                    description="Try to temporarily hide away all balance-related numbers"
                    cta={{
                        label: 'Try Discreet mode',
                        action: () => {
                            setDiscreetMode(true);
                        },
                    }}
                />
            )}
        </>
    );

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
            <Content>{!isHidden && cards}</Content>
        </Section>
    );
};

export default SecurityFeatures;
