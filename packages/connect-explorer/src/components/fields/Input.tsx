import { Input as InputComponent } from '@trezor/components';

import { Field } from '../../types';
import { Row } from './Row';

interface InputProps {
    onChange: (field: Field<any>, value: string) => void;
    field: Field<any>;
}

const Input = ({ field, onChange }: InputProps) => (
    <Row>
        <InputComponent
            label={field.name}
            value={field.value}
            onChange={event => onChange(field, event.target.value)}
        />
    </Row>
);

export default Input;
