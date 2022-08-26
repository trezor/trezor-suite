/**
 * From paths like /Users/username/, C:\Users\username\, C:\\Users\\username\\,
 * this matches /Users/, \Users\ or \Users\\ as first group
 * and text (supposed to be a username) before the next slash (or special character not allowed in username)
 * as second group.
 */
export const startOfUserPathRegex = /([/\\][Uu]sers[/\\]{1,4})([^"^'^[^\]^/^\\]*)/g;

export const redactUserPathFromString = (text: string) =>
    text.replace(startOfUserPathRegex, '$1[*]');
