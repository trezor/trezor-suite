import { Banner, Button, Card, Column, H2 } from '@trezor/components';

import type { DeviceIssue } from '../../app/migrationState';
import { BulletList } from '../BulletList';
import { describeDeviceIssue } from '../messages';

type DeviceStepProps = {
    issue?: DeviceIssue;
    isConnecting: boolean;
    onConnect: () => void;
};

export const DeviceStep = ({ issue, isConnecting, onConnect }: DeviceStepProps) => (
    <Card>
        <Column gap={16} alignItems="flex-start">
            <H2>Connect your Trezor One</H2>
            <BulletList>
                <BulletList.Item>Plug the Trezor in with its USB cable.</BulletList.Item>
                <BulletList.Item>Do not hold any button while plugging it in.</BulletList.Item>
                <BulletList.Item>
                    Keep Trezor Suite running. It will show the device as unreadable. That is
                    expected.
                </BulletList.Item>
                <BulletList.Item>Close this tool in every other browser tab.</BulletList.Item>
            </BulletList>
            {issue && <Banner intent="warning" description={describeDeviceIssue(issue)} />}
            <Button isLoading={isConnecting} onClick={onConnect}>
                Connect
            </Button>
        </Column>
    </Card>
);
