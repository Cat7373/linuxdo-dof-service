import { Context } from 'koa'
import { ResultObj, useResult } from '../../util/result.js'
import { CheckInput, useSession } from '../util/index.js'
import { usePrisma, usePrismaTx } from '../../db/index.js'
import { useUserTool } from '../../db/tool/user.js'
import config from '../../config/index.js'
import { useKnex, useKnexTransaction } from '../../db/knex.js'

// 注册 DNF 账号请求数据
interface RegisterDnfAccountBody { dnfUsername: string, dnfPassword: string }
// 修改 DNF 密码请求数据
interface ChangeDnfPasswordBody { dnfPassword: string }
// 绑定角色请求数据
interface BindCharacBody { characNo: number }

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
  @CheckInput('dnfPassword', 'body', { len: [32, 32], type: 'string', regexp: /^[a-z0-9]{32}$/ })
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
      let dnfUId = 0
      await useKnexTransaction(async () => {
        await useKnex().raw(`INSERT INTO d_taiwan.accounts(accountname, password, VIP) VALUES ('${dnfUsername}', '${dnfPassword}', '')`)
        dnfUId = (await useKnex().raw(`SELECT UID FROM d_taiwan.accounts WHERE accountname = '${dnfUsername}'`))[0][0].UID as number
        await useKnex().raw(`INSERT INTO d_taiwan.member_info(m_id, user_id) VALUES (${dnfUId}, ${dnfUId})`)
        await useKnex().raw(`INSERT INTO d_taiwan.member_white_account(m_id) VALUES (${dnfUId})`)
        await useKnex().raw(`INSERT INTO taiwan_login.member_login(m_id) VALUES (${dnfUId})`)
        await useKnex().raw(`INSERT INTO taiwan_billing.cash_cera(account, cera, mod_tran, mod_date, reg_date) VALUES (${dnfUId}, 0, 0, NOW(), NOW())`)
        await useKnex().raw(`INSERT INTO taiwan_billing.cash_cera_point(account, cera_point, mod_date, reg_date) VALUES (${dnfUId}, ${config.registerCash}, NOW(), NOW())`)
        await useKnex().raw(`INSERT INTO taiwan_cain_2nd.member_avatar_coin(m_id) VALUES (${dnfUId})`)  
      })
      
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
  @CheckInput('dnfPassword', 'body', { len: [32, 32], type: 'string', regexp: /^[a-z0-9]{32}$/ })
  async changeDnfPassword(ctx: Context): Promise<ResultObj> {
    // 参数处理
    const { dnfPassword } = ctx.request.body as ChangeDnfPasswordBody
    const uid = useSession(ctx)!.uid

    // 查出用户
    const user = (await useUserTool().findById(uid))!
    if (!user.dnfId) {
      return useResult().fail('您未注册过 DNF 账号，无法修改密码')
    }

    // 修改密码
    await useKnex().raw(`UPDATE d_taiwan.accounts SET password = '${dnfPassword}' WHERE UID = ${user.dnfId}`)

    // 返回结果
    return useResult().success()
  }

  /**
   * 查询用户角色列表
   * GET /api/user/listCharac
   */
  async listCharac(ctx: Context): Promise<ResultObj> {
    // 参数处理
    const uid = useSession(ctx)!.uid

    // 查出用户
    const user = (await useUserTool().findById(uid))!

    // 查出角色列表
    const characList = (await useKnex().raw(`SELECT charac_no, charac_name FROM taiwan_cain.charac_info WHERE m_id = ${user.dnfId}`))[0]

    // 返回结果
    return useResult().success(characList)
  }

  /**
   * 绑定角色
   * POST /api/user/bindCharac
   */
  @CheckInput('characNo', 'body', { type: 'number' })
  async bindCharac(ctx: Context): Promise<ResultObj> {
    // 参数处理
    const { characNo } = ctx.request.body as BindCharacBody
    const uid = useSession(ctx)!.uid

    // 查出用户
    const user = (await useUserTool().findById(uid))!

    // 查出角色列表
    const characList = (await useKnex().raw(`SELECT charac_no, charac_name FROM taiwan_cain.charac_info WHERE m_id = ${user.dnfId}`))[0]

    // 判断是否是自己的角色
    const charac = characList.find((item: any) => item.charac_no === characNo)
    if (!charac) {
      return useResult().fail('角色 ID 错误，无法进行绑定')
    }

    // 绑定角色
    await usePrisma().user.update({
      where: { id: uid },
      data: { dnfBindCharacId: charac.charac_no, dnfBindCharacName: charac.charac_name }
    })

    // 返回结果
    return useResult().success()
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
      id: user.id,

      dnfUsername: user.dnfUsername,
      dnfBindCharacName: user.dnfBindCharacName,

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
