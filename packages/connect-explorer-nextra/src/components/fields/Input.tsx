import { Input as InputComponent } from '@trezor/components';

import { FieldBasic } from '../../types';
import { Row } from './Row';

interface InputProps {
    onChange: (field: FieldBasic<any>, value: string) => void;
    field: FieldBasic<any>;
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
