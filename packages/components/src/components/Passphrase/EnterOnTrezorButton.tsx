import { FormattedMessage } from 'react-intl';
import styled, { useTheme } from 'styled-components';
import { Image } from '../Image/Image';
import { DeviceModelInternal } from '@trezor/connect';
import { Card } from '../Card/Card';
import { Icon } from '../assets/Icon/Icon';
import { Text } from '../typography/Text/Text';
import { spacings } from '@trezor/theme';
import { Row } from '../Flex/Flex';

const Flex = styled.div`
    flex: 1;
`;

interface EnterOnTrezorButtonProps {
    submit: (value: string, passphraseOnDevice?: boolean) => void;
    value: string;
    deviceModel?: DeviceModelInternal;
}

export const EnterOnTrezorButton = ({ submit, value, deviceModel }: EnterOnTrezorButtonProps) => {
    const theme = useTheme();

    return (
        <Card
            paddingType="small"
            onClick={() => submit(value, true)}
            data-testid="@passphrase/enter-on-device-button"
        >
            <Row gap={spacings.lg} alignItems="center" justifyContent="space-between">
                {deviceModel && <Image alt="Trezor" image={`TREZOR_${deviceModel}`} height={34} />}
                <Flex>
                    <Text variant="tertiary">
                        <FormattedMessage
                            id="TR_ENTER_PASSPHRASE_ON_DEVICE"
                            defaultMessage="or enter on Trezor"
                        />
                    </Text>
                </Flex>
                <Icon icon="ARROW_RIGHT" color={theme.iconSubdued} />
            </Row>
        </Card>
    );
};
