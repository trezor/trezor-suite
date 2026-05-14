import { Card, Checkbox as CheckboxComponent } from '@trezor/components';

import { Row } from './Row';
import { type onFieldChange } from '../../actions/methodActions';
import type { FieldBasic } from '../../types';

interface CheckboxProps {
    field: FieldBasic<boolean>;
    onChange: typeof onFieldChange;
}

const Checkbox = ({ field, onChange, ...rest }: CheckboxProps) => (
    <Row>
        <Card paddingType="small">
            <CheckboxComponent
                onChange={() => onChange(field, !field.value)}
                isChecked={field.value}
                {...rest}
            >
                {field.name}
            </CheckboxComponent>
        </Card>
    </Row>
);

export default Checkbox;
