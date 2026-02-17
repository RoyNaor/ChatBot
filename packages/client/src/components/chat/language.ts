export const HEBREW_UNICODE_RANGE = /[\u0590-\u05FF]/;

export const isHebrew = (value: string): boolean => HEBREW_UNICODE_RANGE.test(value);

export const detectMessageDirection = (value: string): 'rtl' | 'ltr' =>
  isHebrew(value) ? 'rtl' : 'ltr';

export const getMessageMeta = (value: string) => {
  const direction = detectMessageDirection(value);

  return {
    direction,
    isRtl: direction === 'rtl',
  };
};
