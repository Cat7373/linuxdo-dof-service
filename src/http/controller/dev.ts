import { Context } from 'koa'
import { ResultObj, useResult } from '../../util/result.js'
import { useKnex } from '../../db/knex.js'
import config from '../../config/index.js'
import dayjs from 'dayjs'

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
    // 测试查询角色清单
    const res1 = await useKnex().raw(`SELECT charac_no, charac_name FROM taiwan_cain.charac_info WHERE m_id = 18000000`)

    // 36 = 服务器喇叭
    const res2 = await useKnex().raw(`INSERT INTO taiwan_cain_2nd.postal (occ_time, send_charac_name, receive_charac_no, item_id, add_info, gold) VALUES ('${dayjs().format('YYYY-MM-DD HH:mm:ss')}', 'LinuxDo', 1, 36, 1, 100)`)

    return useResult().success({ res1, res2 })
  }
}

const instance = new DevController()
export function useDevController() {
  return instance
}
