const CUSTOM_ERRORS = [
  'AuthorizationError',
  'APIRequestError',
  'ConfigError',
  'InputValidationError',
] as const;

type CustomErrors = {
  [K in (typeof CUSTOM_ERRORS)[number]]: ErrorConstructor;
};

export const ERRORS = CUSTOM_ERRORS.reduce((acc, className) => {
  acc = {
    ...acc,
    [className]: class extends Error {
      constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
      }
    },
  };

  return acc;
}, {} as CustomErrors);
