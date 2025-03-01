/**
 * 返回值结构定义
 */
export interface ResultObj<T=any> {
  success: boolean,
  code: number,
  message: string | null,
  data: T | null
}

/**
 * 返回值工具
 */
class Result {
  /**
   * 创造原始返回值
   */
  result<T=unknown>(success: boolean, code: number, message: string, data: any): ResultObj<T> {
    return { success, code, message, data }
  }

  /**
   * 创造成功的返回值
   */
  success<T=unknown>(data: any={}, code=0): ResultObj<T> {
    return this.result(true, code, '', data)
  }

  /**
   * 创造失败的返回值
   */
  fail<T=unknown>(message='', code=-1): ResultObj<T> {
    return this.result(false, code, message, {})
  }
}

const instance = new Result()
export function useResult() {
  return instance
}
