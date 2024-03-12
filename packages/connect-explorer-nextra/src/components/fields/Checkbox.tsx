import { Card, Checkbox as CheckboxComponent } from '@trezor/components';

import type { FieldBasic } from '../../types';
import { onFieldChange } from '../../actions/methodActions';
import { Row } from './Row';

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
