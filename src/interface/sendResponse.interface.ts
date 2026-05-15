export type TMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type TData<T> = {
  statusCode: number;
  success: boolean;
  token?: string;
  message: string;
  data: T;
  meta?: TMeta;
};
