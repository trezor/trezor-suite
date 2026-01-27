import { Translation } from '@suite/intl';
import { Link, Text } from '@trezor/components';

export function TxSimulationProvider() {
    return (
        <Text variant="tertiary">
            <Translation
                id="TR_SIMULATION_POWERED_BY"
                values={{
                    provider: <Link href="https://blockaid.io">Blockaid</Link>,
                }}
            />
        </Text>
    );
}
