import { saveAs } from 'file-saver';

export const saveFile = (data: string | Blob, filename: string) => {
    return saveAs(data, filename);
};
