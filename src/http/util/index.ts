import { Context } from "koa"
import { useResult } from "../../util/result.js"

/**
 * 处理 Koa 的输入参数，始终获取一个参数
 * @param input Koa 输入的参数
 * @returns 转换后的参数清单
 */
export function koaFirstQueryParam<T>(input: NodeJS.Dict<T | T[]>): NodeJS.Dict<T> {
  const result: NodeJS.Dict<T> = {}

  for (const key in input) {
    const value = input[key]

    if (Array.isArray(value)) {
      result[key] = value[0]
    } else {
      result[key] = value
    }
  }

  return result
}

/**
 * 进行参数验证
 * @param name 参数名
 * @param source 参数来源
 * @param notNull 要求检测非 null 或 undefined
 * @param notBlank 要求检测非空(默认检测此项)
 * @param len [minLen, maxLen] 限制长度范围
 * @param type 要求的数据类型(仅限 body)
 * @param enums 要求值在给定范围内
 * @param min 要求输入内容为数值，且不能小于给定值
 * @param max 要求输入内容为数值，且不能大于给定值
 * @param regexp 要求符合正则表达式规则
 * @param message 不符合规则时的错误提示内容
 */
export function CheckInput(name: string, source: 'path' | 'body', {
  notNull=true, notBlank=true, len=undefined,
  type=undefined, enums=undefined,
  min=undefined, max=undefined,
  regexp=undefined
}: { notNull?: boolean, notBlank?: boolean, len?: [number | undefined, number | undefined], type?: string, enums?: ReadonlyArray<string>, min?: number, max?: number, regexp?: RegExp }={}, message=undefined) {
  return function(target: (ctx: Context) => Promise<any | void>, desc: ClassMethodDecoratorContext): any {
    return async function (ctx: Context) {
      // @ts-ignore
      const controller = this

      // 获取参数值
      let val: string | undefined
      switch (source) {
        case 'path':
          val = ctx.query[name] as string | undefined
          break
        case 'body':
          val = (ctx.request.body as any)[name]
          break
      }

      // 非 null 检测
      if (val === null || val === undefined) {
        if (notNull) {
          return useResult().fail(message || `缺少参数 ${name}`)
        } else {
          return target.call(controller, ctx) // 已经是空了，后续检测没有意义了
        }
      }

      // 非空检测
      if (!String(val).trim()) {
        if (notBlank) {
          return useResult().fail(message || `参数 ${name} 不能为空`)
        } else {
          return target.call(controller, ctx) // 已经是空了，后续检测没有意义了
        }
      }

      // 长度检测
      if (len) {
        const [ minLen, maxLen ] = len
        if (minLen && val.length < minLen) {
          return useResult().fail(message || `参数 ${name} 长度低于最小限制 ${minLen}`)
        }
        if (maxLen && val.length > maxLen) {
          return useResult().fail(message || `参数 ${name} 长度超过最大限制 ${maxLen}`)
        }
      }

      // 类型检查
      if (type) {
        if (source != 'body') throw new Error('type 检查只能用于 body 中的数据')

        const t = typeof val
        if (t != type) {
          return useResult().fail(message || `参数 ${name} 的类型 ${t} 与要求的类型 ${type} 不一致`)
        }
      }

      // 要求特定取值范围
      if (enums) {
        if (!enums.includes(val)) {
          return useResult().fail(message || `参数 ${name} 的值 ${val} 无效`)
        }
      }

      // 数值范围检测
      if (min || max) {
        let num
        try {
          num = Number(val)
        } catch {
          return useResult().fail(message || `参数 ${name} 不是有效的数字`)
        }

        if (min !== undefined && num < min) {
          return useResult().fail(message || `参数 ${name} 小于最小值 ${min}`)
        }
        if (max !== undefined && num > max) {
          return useResult().fail(message || `参数 ${name} 大于最大值 ${max}`)
        }
      }

      // 正则检测
      if (regexp && !((regexp as RegExp).test(val))) {
        return useResult().fail(message || `参数 ${name} 不符合规则`)
      }

      return target.call(controller, ctx)
    }
  }
}

/**
 * 获取用户 Session
 * @param ctx HTTP 请求上下文
 * @returns 若已登陆，返回登陆信息，若未登陆，返回 null
 */
export function useSession(ctx: Context) {
  if (!ctx.session?.['uid']) { // 未登陆的，返回 null
    return null
  }

  return {
    uid: ctx.session!['uid'] as number,
    linuxDoUid: ctx.session!['linuxDoUid'] as number,
  }
}
