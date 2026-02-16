import { ReactNode } from 'react';

import { Translation, TranslationKey } from '@suite/intl';
import { Banner as BaseBanner, Card, Checkbox, Column, Text } from '@trezor/components';

export interface TxSimulationBannerProps {
    title: TranslationKey;
    description: ReactNode;
    type: 'error' | 'warning';
    disclaimerAccepted: boolean;
    setDisclaimerAccepted: (value: boolean) => void;
}

export const TxSimulationBanner = ({
    title,
    description,
    type = 'error',
    disclaimerAccepted,
    setDisclaimerAccepted,
}: TxSimulationBannerProps) => (
    <BaseBanner
        intent={type === 'warning' ? 'warning' : 'critical'}
        data-testid="@tx-simulation-modal/error-banner"
        description={
            <Column width="100%" padding={{ vertical: 4 }}>
                <Text typographyStyle="callout">
                    <Translation id={title} />
                </Text>
                <Text>{description}</Text>

                <Card margin={{ top: 12 }} paddingType="small">
                    <Checkbox
                        data-testid="@tx-simulation-modal/disclaimer-checkbox"
                        isChecked={disclaimerAccepted}
                        onClick={() => setDisclaimerAccepted(!disclaimerAccepted)}
                        verticalAlignment="center"
                    >
                        <Text intent="neutral" typographyStyle="hint">
                            <Translation id="TR_SIMULATION_DISCLAIMER_OVERRIDE" />
                        </Text>
                    </Checkbox>
                </Card>
            </Column>
        }
    />
);
