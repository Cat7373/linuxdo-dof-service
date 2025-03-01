import { Context } from 'koa'
import { ResultObj, useResult } from '../../util/result.js'
import { CheckInput, useSession } from '../util/index.js'
import { usePrisma, usePrismaTx } from '../../db/index.js'
import { useUserTool } from '../../db/tool/user.js'
import md5 from 'md5'
import config from '../../config/index.js'
import { useKnex } from '../../db/knex.js'

// 注册 DNF 账号请求数据
interface RegisterDnfAccountBody { dnfUsername: string, dnfPassword: string }
// 修改 DNF 密码请求数据
interface ChangeDnfPasswordBody { dnfPassword: string }

/**
 * 用户接口
 * /api/user
 */
class UserController {
  /**
   * 注册 DNF 账号
   * POST /api/user/registerDnfAccount
   */
  @CheckInput('dnfUsername', 'body', { len: [3, 50], type: 'string', regexp: /^[a-zA-Z0-9]+$/ })
  @CheckInput('dnfPassword', 'body', { len: [6, 50], type: 'string', regexp: /^[a-zA-Z0-9]+$/ })
  async registerDnfAccount(ctx: Context): Promise<ResultObj> {
    // 参数处理
    const { dnfUsername, dnfPassword } = ctx.request.body as RegisterDnfAccountBody
    const uid = useSession(ctx)!.uid

    return usePrismaTx(async () => {
      const user = (await useUserTool().findById(uid))!
      if (user.dnfId) {
        return useResult().fail('您已注册过 DNF 账号，请勿重复注册')
      }

      // 检查用户名不能重复
      if (await usePrisma().user.findUnique({ where: { dnfUsername } })) {
        return useResult().fail('注册失败，用户名已被占用')
      }

      // 注册账号
      const md5Pwd = md5(dnfPassword)
      await await useKnex().raw(`INSERT INTO d_taiwan.accounts(accountname, password, VIP) VALUES (${dnfUsername}, ${md5Pwd}, '')`)
      const dnfUId = (await useKnex().raw(`SELECT UID FROM d_taiwan.accounts WHERE accountname = ${dnfUsername}`))[0][0].UID as number
      await await useKnex().raw(`INSERT INTO d_taiwan.member_info(m_id, user_id) VALUES (${dnfUId}, ${dnfUId})`)
      await await useKnex().raw(`INSERT INTO d_taiwan.member_white_account(m_id) VALUES (${dnfUId})`)
      await await useKnex().raw(`INSERT INTO taiwan_login.member_login(m_id) VALUES (${dnfUId})`)
      await await useKnex().raw(`INSERT INTO taiwan_billing.cash_cera(account, cera, mod_tran, mod_date, reg_date) VALUES (${dnfUId}, 0, 0, NOW(), NOW())`)
      await await useKnex().raw(`INSERT INTO taiwan_billing.cash_cera_point(account, cera_point, mod_date, reg_date) VALUES (${dnfUId}, ${config.registerCash}, NOW(), NOW())`)
      await await useKnex().raw(`INSERT INTO taiwan_cain_2nd.member_avatar_coin(m_id) VALUES (${dnfUId})`)

      // 更新用户信息
      await usePrisma().user.update({
        where: { id: uid },
        data: { dnfId: dnfUId, dnfUsername, dnfRegisterTime: new Date() }
      })

      // 返回结果
      return useResult().success()
    })
  }

  /**
   * 修改 DNF 密码
   * POST /api/user/changeDnfPassword
   */
  @CheckInput('dnfPassword', 'body', { len: [6, 50], type: 'string', regexp: /^[a-zA-Z0-9]+$/ })
  async changeDnfPassword(ctx: Context): Promise<ResultObj> {
    // 参数处理
    const { dnfPassword } = ctx.request.body as ChangeDnfPasswordBody
    const uid = useSession(ctx)!.uid

    return usePrismaTx(async () => {
      // 查出用户
      const user = (await useUserTool().findById(uid))!
      if (!user.dnfId) {
        return useResult().fail('您未注册过 DNF 账号，无法修改密码')
      }

      // 修改密码
      const md5Pwd = md5(dnfPassword)
      await useKnex().raw(`UPDATE d_taiwan.accounts SET password = ${md5Pwd} WHERE UID = ${user.dnfId}`)

      // 返回结果
      return useResult().success()
    })
  }

  /**
   * 查询用户信息
   * GET /api/user/info
   */
  async info(ctx: Context): Promise<ResultObj> {
    const uid = useSession(ctx)!.uid
    const user = (await useUserTool().findById(uid))!
   
    // 返回结果
    return useResult().success({
      dnfUsername: user.dnfUsername,

      linuxDoName: user.linuxDoName,
      linuxDoUsername: user.linuxDoUsername,
      linuxDoTrustLevel: user.linuxDoTrustLevel,
    })
  }
}

const instance = new UserController()
export function useUserController() {
  return instance
}
