import { type Action } from '@suite-common/suite-types';
import { Column, InfoItem, Row } from '@trezor/components';
import { BrowsersIcon, CheckFatIcon, CoinsIcon, DevicesIcon, GlobeIcon } from '@trezor/icons';
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
            <InfoItem label="Conditions" icon={CheckFatIcon} intent="neutral" priority="primary">
                -
            </InfoItem>
        );
    }

    return conditions.map(({ environment, os, devices, settings, countryCodes }, index) => (
        <Column key={index} gap={spacings.sm}>
            <Row gap={spacings.sm} alignItems="flex-start">
                <MessageSystemCondition label="Environment" icon={DevicesIcon} data={environment} />

                <MessageSystemCondition label="Operating System" icon={BrowsersIcon} data={os} />

                <MessageSystemCondition label="Settings" icon={CoinsIcon} data={settings} />

                <InfoItem
                    label="Country codes"
                    icon={GlobeIcon}
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
