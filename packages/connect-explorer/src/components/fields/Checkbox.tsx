import { Checkbox as CheckboxComponent } from '@trezor/components';

import type { Field } from '../../types';
import { onFieldChange } from '../../actions/methodActions';
import { Row } from './Row';

interface CheckboxProps {
    field: Field<boolean>;
    onChange: typeof onFieldChange;
}

const Checkbox = ({ field, onChange, ...rest }: CheckboxProps) => (
    <Row>
        <CheckboxComponent
            onClick={_e => onChange(field, !field.value)}
            isChecked={field.value}
            {...rest}
        >
            {field.name}
        </CheckboxComponent>
    </Row>
);

export default Checkbox;
