export type TErrorSource = {
  path: string | number;
  message: string;
};

export type TApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T | null;
  errorSources?: TErrorSource[];
  stack?: string;
};
