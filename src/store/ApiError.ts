export const getApiError = (
  err: any,
  fallbackMessage = "Something went wrong",
): string => {
  return err?.response?.data?.message || err?.message || fallbackMessage;
};
