import { Context } from 'koa'
import { ResultObj, useResult } from '../../util/result.js'
import { usePrisma, usePrismaTx } from '../../db/index.js'
import { useSession } from '../util/index.js'
import config from '../../config/index.js'
import { useUserTool } from '../../db/tool/user.js'
import { useKnex, useKnexTransaction } from '../../db/knex.js'

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
      // 查出用户
      const user = (await useUserTool().findById(uid))!

      // 不允许被禁言的用户签到
      if (user.linuxDoSilenced) {
        return useResult().fail('您当前已被 LinuxDo 禁言，暂时无法签到')
      }

      if (!user.dnfId) {
        return useResult().fail('您未注册过 DNF 账号，无法签到')
      }

      // 查询签到记录
      const signInRecord = await usePrisma().userSignInRecord.findUnique({ where: { uid } })

      // 判断是否签到
      if ((signInRecord?.days as number[])?.includes(day)) {
        return useResult().fail('您今天已经签到过，请勿重复签到')
      }

      // 进行签到
      await usePrisma().userSignInRecord.upsert({
        where: { uid },
        update: { days: [...((signInRecord?.days as number[]) ?? []), day] },
        create: { uid, days: [day] },
      })


      // 计算累计签到奖励
      const cumulativeDays = (((signInRecord?.days as number[])?.length || 0) + 1)
      const cumulativeConf = config.signInReward.cumulativeCash[cumulativeDays]

      await useKnexTransaction(async () => {
        // 发放每日签到奖励
        await useKnex().raw(`UPDATE taiwan_billing.cash_cera_point SET cera_point = cera_point + ${config.signInReward.dailyCash} WHERE account = ${user.dnfId}`)

        // 发放累计签到奖励
        if (cumulativeConf && user.linuxDoTrustLevel >= cumulativeConf[2]) {
          await useKnex().raw(`UPDATE taiwan_billing.cash_cera_point SET cera_point = cera_point + ${cumulativeConf[0]} WHERE account = ${user.dnfId}`)
        }
      })

      // 返回结果
      return useResult().success({
        dailyCash: config.signInReward.dailyCash,
        cumulativeDays,
        cumulativeCash: cumulativeConf?.[1],
      })
    })
  }
}

const instance = new SignInController()
export function useSignInController() {
  return instance
}
