import { Context } from 'koa'
import { ResultObj, useResult } from '../../util/result.js'
import { sendReward } from '../../util/index.js'

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
    await sendReward(18000000, 1, {
      items: [
        { id: 8300,   count: 2 },   // 30% +10 装备强化卷 x2
        { id: 8316,   count: 1 },   // 30% +10 装备增幅卷 x1

        { id: 8301,   count: 1 },   // 30% +12 装备强化卷 x1
        { id: 8317,   count: 1 },   // 30% +12 装备增幅卷 x1

        { id: 8298,   count: 2 },   // 10% +12 装备强化卷 x2
        { id: 8314,   count: 1 },   // 10% +12 装备增幅卷 x1

        { id: 8304,   count: 1 },    // 50% +12 装备强化卷 x1
        { id: 8320,   count: 1 },    // 50% +12 装备增幅卷 x1

        { id: 8307,   count: 2 },    // 90% +12 装备强化卷 x2
        { id: 8323,   count: 2 },    // 90% +12 装备增幅卷 x2

        { id: 7275,   count: 1 },    // +12 装备强化卷 x1
        { id: 8237,   count: 1 },    // +12 装备增幅卷 x1
      ],
    })

    return useResult().success()
  }
}

const instance = new DevController()
export function useDevController() {
  return instance
}
