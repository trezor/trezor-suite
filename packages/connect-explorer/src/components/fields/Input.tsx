import { Input as InputComponent } from '@trezor/components';

import { Field } from '../../types';
import { Row } from './Row';

interface InputProps {
    onChange: (field: Field<any>, value: string) => void;
    field: Field<any>;
    dataTest?: string;
}

const Input = ({ dataTest, field, onChange }: InputProps) => (
    <Row>
        <InputComponent
            dataTest={dataTest}
            label={field.name}
            value={field.value}
            onChange={event => onChange(field, event.target.value)}
        />
    </Row>
);

export default Input;
