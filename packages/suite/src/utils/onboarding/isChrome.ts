// todo: this might not be used anymore
// todo: typescript
export default (navigator: any) =>
    /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
