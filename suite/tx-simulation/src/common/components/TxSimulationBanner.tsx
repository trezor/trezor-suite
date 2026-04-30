import { type ReactNode } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { Banner as BaseBanner, Card, Checkbox, Column, Text } from '@trezor/components';

export interface TxSimulationBannerProps {
    title: TranslationKey;
    description?: ReactNode;
    type: 'error' | 'warning';
    isAccepted: boolean;
    onChange: (value: boolean) => void;
}

export const TxSimulationBanner = ({
    title,
    description,
    type = 'error',
    isAccepted,
    onChange,
}: TxSimulationBannerProps) => (
    <BaseBanner
        intent={type === 'warning' ? 'warning' : 'critical'}
        data-testid="@tx-simulation-modal/error-banner"
        description={
            <Column width="100%" padding={{ vertical: 4 }}>
                <Text typographyStyle="body-sm-strong">
                    <Translation id={title} />
                </Text>
                {description && <Text>{description}</Text>}

                <Card margin={{ top: 12 }} paddingType="small">
                    <Checkbox
                        data-testid="@tx-simulation-modal/disclaimer-checkbox"
                        isChecked={isAccepted}
                        onChange={() => onChange(!isAccepted)}
                        verticalAlignment="center"
                    >
                        <Text intent="neutral" typographyStyle="body-sm">
                            <Translation id="TR_SIMULATION_DISCLAIMER_OVERRIDE" />
                        </Text>
                    </Checkbox>
                </Card>
            </Column>
        }
    />
);
