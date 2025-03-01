import knex from 'knex'
import { AsyncLocalStorage } from 'async_hooks'
import { useEnv } from '../util/env.js'

// DB 连接池
let dbPool: knex.Knex
// 事务跟踪工具
const txTrackId = new AsyncLocalStorage<knex.Knex>()
 
 /**
  * 初始化数据库
  */
export async function initDatabase() {
  dbPool = knex({
    client: 'mysql2',
    connection: useEnv().knexDatabaseUrl,
    pool: {
      min: 2,
      max: 10
    },
  })
 }

/**
 * 获取 DB 实例，进行数据库操作
 * @param {Boolean} tx 是否自动使用事务对象(若有)
 * @returns DB 实例
 */
export function useKnex(tx=true) {
  return (tx && getTx()) || dbPool
}

/**
 * 进行事务操作，重入时，事务会合并(即不支持子事务)
 * @param {Function} code 事务中的代码
 * @returns code 的返回值
 */
export async function useKnexTransaction<T>(code: () => Promise<T>): Promise<T> {
  const existsTx = getTx()
  if (existsTx) {
    return await code()
  } else {
    return await useKnex().transaction(tx => txTrackId.run(tx, code))
  }
}

/**
 * 获取当前事务对象(若有)
 */
export function getTx() {
  return txTrackId.getStore()
}
