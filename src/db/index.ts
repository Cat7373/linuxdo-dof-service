import { Prisma, PrismaClient } from '@prisma/client'
import { AsyncLocalStorage } from 'async_hooks'
import { ITXClientDenyList, Result } from '@prisma/client/runtime/library'

// 全局 Prisma 实例
const globalPrisma = new PrismaClient()
// 事务跟踪存储容器
const txStore = new AsyncLocalStorage<Omit<typeof globalPrisma, ITXClientDenyList>>()

/**
 * 初始化数据库
 */
export async function initDatabase() {
}

/**
 * 分页查询结果的数据类型
 */
export type PagerResult<M, A> = {
  /**
   * 当前页的数据集
   */
  list: Result<M, A, 'findMany'>,
  /**
   * 当前查询的是第几页的数据
   */
  page: number,
  /**
   * 总共有多少条记录
   */
  totalRow: number,
  /**
   * 总共有多少页记录
   */
  totalPage: number,
}

/**
 * 分页查询
 * @param model 要查询的表，如 usePrisma().user
 * @param queryParams 查询参数清单（参考对应表的 findMany）
 * @param page 要查询第几页的数据
 * @param pageSize 每页的数据条数
 * @returns 分页查询结果
 */
// TODO 如何处理 omit 和 select？
export async function findPager<M, A extends Prisma.Args<M, 'findMany'>>(model: M, queryParams: A, page: number, pageSize: number): Promise<PagerResult<M, A>> {
  // 查出总记录数
  const totalRow = await (model as any).count({ where: queryParams.where }) as number

  // 计算总页数
  const take = pageSize
  const totalPage = Math.ceil(totalRow / take)

  // 本次查询的是第几页
  const pageNumber = Math.max(Math.min(page, totalPage), 1)

  // 计算应跳过多少条记录
  const skip = (pageNumber - 1) * take

  // 查询记录
  const list = await (model as any).findMany({ ...queryParams, take, skip }) as Result<M, A, 'findMany'>

  // 返回结果
  return {
    list,
    page: pageNumber,
    totalRow,
    totalPage,
  }
}

/**
 * 使用原始 Prisma 客户端（全功能）
 * @returns Prisma 客户端
 */
export function useRawPrisma(): typeof globalPrisma {
  return globalPrisma
}

/**
 * 使用 Prisma 客户端
 * @param autoTx 是否自动加入已有的事务中
 * @returns Prisma 客户端
 */
export function usePrisma(autoTx=true): Omit<typeof globalPrisma, ITXClientDenyList> {
  if (autoTx) {
    const existsTx = txStore.getStore()
    if (existsTx) {
      return existsTx
    }
  }

  return globalPrisma
}

/**
 * 执行事务
 * 支持嵌套事务，不支持子事务(会随主事务一并提交或失败)
 * @param code 事务代码（内部正常使用 usePrisma() 即可，如需回滚，请抛出任意异常）
 * @param maxWait 等待获取到事务的最长时间
 * @param timeout 事务执行的最长时间
 * @returns 事务结果
 */
export async function usePrismaTx<T=unknown>(code: () => Promise<T>, { maxWait=5_000, timeout=30_000 }={}): Promise<T> {
  const existsTx = txStore.getStore()
  if (existsTx) {
    return await code()
  } else {
    return await globalPrisma.$transaction(tx => txStore.run(tx, code), { maxWait, timeout })
  }
}
