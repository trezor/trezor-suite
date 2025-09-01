import { Action } from '@suite-common/suite-types';
import { Column, InfoItem, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { MessageSystemManagerCondition } from './MessageSystemManagerCondition';
import { MessageSystemManagerDevices } from './MessageSystemManagerDevices';

type MessageSystemManagerConditionGroupProps = {
    conditions: Action['conditions'];
};

// TODO: Add rarely used conditions: duration, browser, transport, settings.
export const MessageSystemManagerConditionGroup = ({
    conditions,
}: MessageSystemManagerConditionGroupProps) => {
    if (!conditions || conditions.length === 0) {
        return (
            <InfoItem label="Conditions" iconName="checkFat" variant="default">
                -
            </InfoItem>
        );
    }

    return conditions.map(({ environment, os, devices, settings, countryCodes }, index) => (
        <Column key={index} gap={spacings.sm}>
            <Row gap={spacings.sm} alignItems="flex-start">
                <MessageSystemManagerCondition
                    label="Environment"
                    iconName="devices"
                    data={environment}
                />

                <MessageSystemManagerCondition
                    label="Operating System"
                    iconName="browsers"
                    data={os}
                />

                <MessageSystemManagerCondition label="Settings" iconName="coins" data={settings} />

                <InfoItem label="Country codes" iconName="globe" variant="default">
                    {countryCodes ? countryCodes.join(', ') : '-'}
                </InfoItem>
            </Row>
            <MessageSystemManagerDevices devices={devices} />
        </Column>
    ));
};
