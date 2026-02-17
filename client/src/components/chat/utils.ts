const HEBREW_CHARACTER_PATTERN = /[\u0590-\u05FF]/;

export const isRtlText = (text: string) => HEBREW_CHARACTER_PATTERN.test(text);
