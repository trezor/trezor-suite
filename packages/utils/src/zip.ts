export const createZip = (buffers: { name: string; content: ArrayBuffer }[]) => {
    const fileEntries: ArrayBuffer[] = [];
    const centralDirectory: ArrayBuffer[] = [];
    let offset = 0;

    buffers.forEach(({ name, content }) => {
        const fileData = content;
        const fileHeader = new Uint8Array(30 + name.length);
        const localFileHeader = new DataView(fileHeader.buffer);

        // Local file header signature
        localFileHeader.setUint32(0, 0x04034b50, true); // "PK\3\4"
        localFileHeader.setUint16(4, 0x0, true); // Version needed to extract
        localFileHeader.setUint16(6, 0x0, true); // General purpose bit flag
        localFileHeader.setUint16(8, 0x0, true); // Compression method (none)
        localFileHeader.setUint16(10, 0x0, true); // File last mod time
        localFileHeader.setUint16(12, 0x0, true); // File last mod date
        localFileHeader.setUint32(14, 0, true); // CRC-32 (skipped for simplicity)
        localFileHeader.setUint32(18, fileData.byteLength, true); // Compressed size
        localFileHeader.setUint32(22, fileData.byteLength, true); // Uncompressed size
        localFileHeader.setUint16(26, name.length, true); // Filename length

        // Filename
        fileHeader.set(new TextEncoder().encode(name), 30);

        fileEntries.push(fileHeader, fileData);

        // Central directory
        const centralHeader = new Uint8Array(46 + name.length);
        const centralView = new DataView(centralHeader.buffer);

        centralView.setUint32(0, 0x02014b50, true); // "PK\1\2"
        centralView.setUint16(4, 0x0, true); // Version made by
        centralView.setUint16(6, 0x0, true); // Version needed to extract
        centralView.setUint16(8, 0x0, true); // General purpose bit flag
        centralView.setUint16(10, 0x0, true); // Compression method (none)
        centralView.setUint16(12, 0x0, true); // File last mod time
        centralView.setUint16(14, 0x0, true); // File last mod date
        centralView.setUint32(16, 0, true); // CRC-32
        centralView.setUint32(20, fileData.byteLength, true); // Compressed size
        centralView.setUint32(24, fileData.byteLength, true); // Uncompressed size
        centralView.setUint16(28, name.length, true); // Filename length
        centralView.setUint32(42, offset, true); // Offset of local header

        centralHeader.set(new TextEncoder().encode(name), 46);

        centralDirectory.push(centralHeader);
        offset += fileHeader.length + fileData.byteLength;
    });

    // End of central directory record
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);

    eocdView.setUint32(0, 0x06054b50, true); // "PK\5\6"
    eocdView.setUint16(8, centralDirectory.length, true); // Total number of entries
    eocdView.setUint16(10, centralDirectory.length, true); // Total number of entries
    eocdView.setUint32(
        12,
        centralDirectory.reduce((sum, cd) => sum + cd.byteLength, 0),
        true,
    ); // Size of central directory
    eocdView.setUint32(16, offset, true); // Offset of start of central directory

    return new Blob([...fileEntries, ...centralDirectory, eocd], {
        type: 'application/zip',
    });
};
