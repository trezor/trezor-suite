// Triggers a client-side download for a given Blob or MediaSource object.
export const triggerWebDownloadFile = (obj: Blob | MediaSource, fileName: string): void => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(obj);
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
};
