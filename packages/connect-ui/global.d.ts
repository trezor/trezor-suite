declare module '*.svg' {
    const value: any;
    export = value;
}

interface Window {
    closeWindow: () => void;
}
