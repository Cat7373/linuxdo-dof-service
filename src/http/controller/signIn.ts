import { Context } from 'koa'
import { ResultObj, useResult } from '../../util/result.js'
import { usePrisma, usePrismaTx } from '../../db/index.js'
import { useSession } from '../util/index.js'
import config from '../../config/index.js'

/**
 * 签到接口 /api/signIn
 */
class SignInController {
  /**
   * 查询签到信息
   * GET /api/signIn/info
   */
  async info(ctx: Context): Promise<ResultObj> {
    const uid = useSession(ctx)!.uid

    const signInRecord = await usePrisma().userSignInRecord.findUnique({ where: { uid } })

    return useResult().success({
      conf: config.signInReward,
      signInDays: signInRecord?.days || [],
    })
  }

  /**
   * 签到
   * POST /api/signIn/signIn
   */
  async signIn(ctx: Context): Promise<ResultObj> {
    const uid = useSession(ctx)!.uid

    // 每天 04:00 之前不开放签到
    if (new Date().getHours() < 4) {
      return useResult().fail('每天 04:00 后开放签到 (鼓励早睡喵)')
    }

    const day = new Date().getDate()

    return await usePrismaTx(async () => {
      // 查询签到记录
      const signInRecord = await usePrisma().userSignInRecord.findUnique({ where: { uid } })

      // 判断是否签到
      if ((signInRecord?.days as number[])?.includes(day)) {
        return useResult().fail('您今天已经签到过，请勿重复签到')
      }

      let totalCash = config.signInReward.dailyCash

      // 进行签到
      await usePrisma().userSignInRecord.upsert({
        where: { uid },
        update: { days: [...(signInRecord!.days as number[]), day] },
        create: { uid, days: [day] },
      })

      // 发放每日签到奖励
      await usePrisma().$queryRaw `UPDATE taiwan_billing.cash_cera_point SET cera_point = cera_point + ${config.signInReward.dailyCash} WHERE account = ${uid}`

      // 发放累计签到奖励
      const cumulativeDays = (((signInRecord?.days as number[])?.length || 0) + 1)
      const cumulativeCash = config.signInReward.cumulativeCash[cumulativeDays]
      if (cumulativeCash && cumulativeCash > 0) {
        await usePrisma().$queryRaw `UPDATE taiwan_billing.cash_cera_point SET cera_point = cera_point + ${cumulativeCash} WHERE account = ${uid}`
        totalCash += cumulativeCash
      }

      // 返回结果
      return useResult().success({ rewardCash: totalCash })
    })
  }
}

const instance = new SignInController()
export function useSignInController() {
  return instance
}
