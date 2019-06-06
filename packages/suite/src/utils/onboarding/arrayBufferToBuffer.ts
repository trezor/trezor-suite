// todo: imporve typescript
const arrayBufferToBuffer = (ab: any): any => {
    const buffer: any = Buffer.alloc(ab);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buffer.length; i++) {
        buffer[i] = view[i];
    }
    return buffer;
};

export default arrayBufferToBuffer;
