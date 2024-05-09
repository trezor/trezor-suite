import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { Image } from '../Image/Image';
import { DeviceModelInternal } from '@trezor/connect';
import { Card } from '../Card/Card';
import { Icon } from '../assets/Icon/Icon';
import { spacingsPx } from '@trezor/theme';

const Row = styled.div`
    display: flex;
    gap: ${spacingsPx.xs};
    align-items: center;
    justify-content: space-between;
`;

interface EnterOnTrezorButtonProps {
    submit: (value: string, passphraseOnDevice?: boolean) => void;
    value: string;
    deviceModel?: DeviceModelInternal;
}

export const EnterOnTrezorButton = ({ submit, value, deviceModel }: EnterOnTrezorButtonProps) => {
    return (
        <Card
            paddingType="small"
            onClick={() => submit(value, true)}
            data-test="@passphrase/enter-on-device-button"
        >
            <Row>
                {deviceModel && <Image alt="Trezor" image={`TREZOR_${deviceModel}`} height={34} />}
                <FormattedMessage
                    id="TR_ENTER_PASSPHRASE_ON_DEVICE"
                    defaultMessage="Enter passphrase on Trezor"
                />
                <Icon icon="ARROW_RIGHT" />
            </Row>
        </Card>
    );
};
