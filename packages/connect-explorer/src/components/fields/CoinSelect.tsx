import { Select } from '@trezor/components';

import type { Field } from '../../types';
import { onFieldChange } from '../../actions/methodActions';
import { Row } from './Row';

interface CoinSelectProps {
    field: Field<any>;
    onChange: typeof onFieldChange;
}

const CoinSelect = ({ field, onChange }: CoinSelectProps) => (
    <Row>
        <Select
            label={field.name}
            value={field.data!.find(d => d.value === field.value)}
            onChange={({ value }) => {
                // event.target.value is always string, if we want to keep number, we need to cast it back.
                if (!Number.isNaN(parseInt(value, 10))) {
                    return onChange(field, Number.parseInt(value, 10));
                }

                return onChange(field, value);
            }}
            options={field.data}
        />
    </Row>
);

export default CoinSelect;
