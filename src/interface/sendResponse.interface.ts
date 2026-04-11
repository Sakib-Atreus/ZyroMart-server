export type TData<T> = {
  statusCode: number
  success: boolean
  token?: string
  message: string
  data: T
}
