import { Button } from '@trezor/components';

import { Row } from './Row';
import type { Field } from '../../types';

interface FileProps {
    field: Field<any>;
    disabled?: boolean;
    onChange: (field: Field<any>, value: any) => any;
}

const File = ({ disabled, field, onChange }: FileProps) => {
    const onFilesAdded = evt => {
        if (disabled) return;
        const files = evt?.target.files;
        const file = files[0];
        const reader = new FileReader();
        reader.onload = event => {
            onChange(field, event?.target?.result);
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <Row style={{ cursor: disabled ? 'default' : 'pointer' }}>
            <Button onClick={() => document!.getElementById('files')?.click()}>Chose File</Button>

            <input
                style={{ display: 'none' }}
                id="files"
                type="file"
                multiple={false}
                onChange={onFilesAdded}
            />
        </Row>
    );
};

export default File;
