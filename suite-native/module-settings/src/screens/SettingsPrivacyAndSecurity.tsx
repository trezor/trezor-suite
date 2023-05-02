import React, { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { analytics, EventType } from '@suite-native/analytics';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import { selectIsAnalyticsEnabled } from '@suite-common/analytics';
import { Box, Card, DiscreetCanvas, Text, useDiscreetMode } from '@suite-native/atoms';
import { useNativeStyles } from '@trezor/styles';

import { TouchableSwitchRow } from '../components/TouchableSwitchRow';

const RowDescription = ({ children }: { children: ReactNode }) => (
    <Text variant="hint" color="textSubdued">
        {children}
    </Text>
);

const DiscreetTextExample = () => {
    const { utils } = useNativeStyles();

    return (
        <DiscreetCanvas
            text="$100"
            color="textSubdued"
            width={30}
            fontSize={utils.typography.hint.fontSize}
            height={utils.typography.hint.lineHeight}
        />
    );
};

const DiscreetModeSwitchRow = () => {
    const { isDiscreetMode, setIsDiscreetMode } = useDiscreetMode();

    const handleSetDiscreetMode = (value: boolean) => {
        setIsDiscreetMode(value);
        analytics.report({
            type: EventType.SettingsDiscreetToggle,
            payload: { discreetMode: value },
        });
    };

    return (
        <TouchableSwitchRow
            text="Hide balances"
            description={
                <Box flexDirection="row" alignItems="center">
                    <RowDescription>{`$100 -> `}</RowDescription>
                    <DiscreetTextExample />
                </Box>
            }
            iconName="detective"
            isChecked={isDiscreetMode}
            onChange={handleSetDiscreetMode}
        />
    );
};

const AnalyticsSwitchRow = () => {
    const isAnalyticsEnabled = useSelector(selectIsAnalyticsEnabled);

    const handleAnalyticsChange = (isEnabled: boolean) => {
        if (isEnabled) {
            analytics.enable();
            return;
        }
        analytics.disable();
    };

    return (
        <TouchableSwitchRow
            text="Usage data"
            iconName="database"
            description={
                <RowDescription>
                    All data is kept strictly anonymous; we only use it to improve the Trezor
                    ecosystem.
                </RowDescription>
            }
            isChecked={isAnalyticsEnabled}
            onChange={handleAnalyticsChange}
        />
    );
};

export const SettingsPrivacyAndSecurity = () => (
    <Screen header={<ScreenHeader content="Privacy & Security" />}>
        <Card>
            <DiscreetModeSwitchRow />
            <AnalyticsSwitchRow />
        </Card>
    </Screen>
);
