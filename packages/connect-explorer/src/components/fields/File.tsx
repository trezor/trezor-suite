import { ChangeEventHandler } from 'react';

import { Button } from '@trezor/components';

import { Row } from './Row';
import type { FieldBasic } from '../../types';

interface FileProps {
    field: FieldBasic<any>;
    disabled?: boolean;
    onChange: (field: FieldBasic<any>, value: any) => any;
}

const File = ({ disabled, field, onChange }: FileProps) => {
    const onFilesAdded: ChangeEventHandler<HTMLInputElement> = evt => {
        if (disabled) return;
        const files = evt?.target.files;
        if (!files || files.length === 0) return;
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
