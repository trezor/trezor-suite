import React from 'react';
import {Button} from 'trezor-ui-components';

const File = (props) => {

    const onFilesAdded = (evt) => {
        if (props.disabled) return;
        const files = evt.target.files;
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            props.onChange(props.field, event.target.result);
        };
        reader.readAsArrayBuffer(file);
    }
  
    return (
        <div
          className="row"
          style={{ cursor: props.disabled ? "default" : "pointer" }}
        >
            <Button onClick={() => document.getElementById('files').click()}>Chose File</Button>

            <input
                style={{display:"none"}}
                id="files"
                type="file"
                multiple={false}
                onChange={onFilesAdded}
            />
        </div>
    );
}

export default File;