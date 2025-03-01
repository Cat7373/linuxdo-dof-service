import { Context } from 'koa'
import { ResultObj, useResult } from '../../util/result.js'
import { useKnex } from '../../db/knex.js'

/**
 * 内部测试接口 - 前端不应该对接此处的任何接口
 * /api/dev
 */
class DevController {
  /**
   * 测试接口
   * GET /api/dev/dev
   */
  async dev(ctx: Context): Promise<ResultObj<any>> {
    const res = (await useKnex().raw(`SELECT UID FROM d_taiwan.accounts WHERE accountname = 'Cat73'`))[0][0].UID

    return useResult().success(res)
  }
}

const instance = new DevController()
export function useDevController() {
  return instance
}
