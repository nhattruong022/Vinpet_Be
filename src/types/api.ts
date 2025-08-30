export interface ApiAbstractResponse {
  message?: string;
  success: boolean;
  returnCode: number;
}

export interface ApiSuccessResponse<T> extends ApiAbstractResponse {
  result: T;
}

export interface ApiErrorResponse extends ApiAbstractResponse {
  detail?: string | null;
}
