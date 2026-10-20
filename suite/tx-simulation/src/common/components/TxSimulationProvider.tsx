import { Translation } from '@suite-lego/intl';
import { Link, Text } from '@trezor/components';

export function TxSimulationProvider() {
    return (
        <Text intent="neutral" priority="secondary">
            <Translation
                id="TR_SIMULATION_POWERED_BY"
                values={{
                    provider: <Link href="https://blockaid.io">Blockaid</Link>,
                }}
            />
        </Text>
    );
}
