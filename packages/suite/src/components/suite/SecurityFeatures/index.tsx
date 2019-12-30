import React from 'react';
import styled from 'styled-components';
import { colors } from '@trezor/components-v2';
import SecurityCard from './components/SecurityCard';
import { TrezorDevice } from '@suite/types/suite';

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
`;

const SectionTitle = styled.div`
    flex: 1;
    font-size: 12px;
    margin-bottom: 2px;
    font-weight: 600;
    text-transform: uppercase;
    color: ${colors.BLACK50};
`;

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    device: TrezorDevice | undefined;
    discreetMode: boolean;
}

const SecurityFeatures = ({ device, discreetMode, ...rest }: Props) => {
    if (!device) return null;
    const needsBackup = device.features && device.features.needs_backup;
    const pinEnabled = device.features && device.features.pin_protection;
    const hiddenWalletCreated = false;
    const featuresCompleted =
        Number(!needsBackup) +
        Number(pinEnabled) +
        Number(discreetMode) +
        Number(hiddenWalletCreated);

    return (
        <Section {...rest}>
            <SectionHeader>
                <SectionTitle>Security Features (Completed {featuresCompleted} of 4)</SectionTitle>
            </SectionHeader>
            <Content>
                {needsBackup ? (
                    <SecurityCard
                        variant="secondary"
                        icon="SIGN"
                        heading="Backup your device"
                        description="Blabla bla why is backup important"
                        cta={{ label: 'Backup now' }}
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
                        cta={{ label: 'Set PIN', action: () => {} }}
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
                        cta={{ label: 'Create hidden wallet', action: () => {} }}
                    />
                )}

                {discreetMode ? (
                    <SecurityCard
                        variant="primary"
                        icon="CHECK"
                        heading="Discrete mode enabled!"
                        cta={{ label: 'Done', action: () => {} }}
                    />
                ) : (
                    <SecurityCard
                        variant="secondary"
                        icon="WALLET"
                        heading="Discrete mode"
                        description="Try to temporarily hide away all balance-related numbers"
                        cta={{ label: 'Try discrete mode', action: () => {} }}
                    />
                )}
            </Content>
        </Section>
    );
};

export default SecurityFeatures;
