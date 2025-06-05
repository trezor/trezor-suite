import { useState } from 'react';

import { Collapsible, Flex, Link, Row, Text } from '@trezor/components';
import { negativeSpacings, spacings } from '@trezor/theme';

import { BluetoothTips } from './BluetoothTips';
import { Translation } from '../Translation';

type NotTrezorYouAreLookingForProps = {
    onReScanClick: () => void;
};

export const NotTrezorYouAreLookingFor = ({ onReScanClick }: NotTrezorYouAreLookingForProps) => {
    const [showTips, setShowTips] = useState(false);

    return (
        <Collapsible isOpen={showTips}>
            <Collapsible.Toggle>
                <Row justifyContent="center" flex="1" margin={{ bottom: spacings.xs }}>
                    <Row onClick={() => setShowTips(prev => !prev)} gap={spacings.xs}>
                        <Link typographyStyle="hint" variant="underline">
                            <Text variant="tertiary">
                                <Translation id="TR_BLUETOOTH_NOT_TREZOR_YOU_ARE_LOOKING_FOR" />
                            </Text>
                        </Link>
                        <Collapsible.ToggleIcon isOpen={showTips} />
                    </Row>
                </Row>
            </Collapsible.Toggle>
            <Collapsible.Content>
                {/* Negative margin for preventing jumps of the ui hen opening/closing the tips */}
                <Flex margin={{ top: negativeSpacings.xs }}>
                    <BluetoothTips
                        onReScanClick={onReScanClick}
                        header={<Translation id="TR_BLUETOOTH_CHECK_TIPS_TRY_AGAIN" />}
                    />
                </Flex>
            </Collapsible.Content>
        </Collapsible>
    );
};
