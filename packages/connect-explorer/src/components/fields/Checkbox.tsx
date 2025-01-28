import { Card, Checkbox as CheckboxComponent } from '@trezor/components';

import { Row } from './Row';
import { onFieldChange } from '../../actions/methodActions';
import type { FieldBasic } from '../../types';

interface CheckboxProps {
    field: FieldBasic<boolean>;
    onChange: typeof onFieldChange;
}

const Checkbox = ({ field, onChange, ...rest }: CheckboxProps) => (
    <Row>
        <Card paddingType="small" onClick={() => onChange(field, !field.value)}>
            <CheckboxComponent onClick={() => {}} isChecked={field.value} {...rest}>
                {field.name}
            </CheckboxComponent>
        </Card>
    </Row>
);

export default Checkbox;
