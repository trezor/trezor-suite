import { type Action } from '@suite-common/suite-types';
import { Column, InfoItem, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { MessageSystemCondition } from './MessageSystemCondition';
import { MessageSystemDevices } from './MessageSystemDevices';

type MessageSystemConditionGroupProps = {
    conditions: Action['conditions'];
};

// TODO: Add rarely used conditions: duration, browser, transport, settings.
export const MessageSystemConditionGroup = ({ conditions }: MessageSystemConditionGroupProps) => {
    if (!conditions || conditions.length === 0) {
        return (
            <InfoItem label="Conditions" iconName="checkFat" intent="neutral" priority="primary">
                -
            </InfoItem>
        );
    }

    return conditions.map(({ environment, os, devices, settings, countryCodes }, index) => (
        <Column key={index} gap={spacings.sm}>
            <Row gap={spacings.sm} alignItems="flex-start">
                <MessageSystemCondition label="Environment" iconName="devices" data={environment} />

                <MessageSystemCondition label="Operating System" iconName="browsers" data={os} />

                <MessageSystemCondition label="Settings" iconName="coins" data={settings} />

                <InfoItem
                    label="Country codes"
                    iconName="globe"
                    intent="neutral"
                    priority="primary"
                >
                    {countryCodes ? countryCodes.join(', ') : '-'}
                </InfoItem>
            </Row>
            <MessageSystemDevices devices={devices} />
        </Column>
    ));
};
