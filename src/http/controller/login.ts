import { Context } from 'koa'
import { ResultObj, useResult } from '../../util/result.js'
import { CheckInput, koaFirstQueryParam, useSession } from '../util/index.js'
import { fetchLinuxDoToken, fetchLinuxDoUserInfo } from '../../api/api.js'
import { useUserTool } from '../../db/tool/user.js'
import { useEnv } from '../../util/env.js'
import config from '../../config/index.js'
import { useTOTP } from '../../util/totp.js'
import { User } from '@prisma/client'
import dayjs from 'dayjs'

/**
 * 登录接口
 * /api/login
 */
class LoginController {
  /**
   * 查询已登陆的用户信息
   * GET /api/login/info
   */
  async info(ctx: Context): Promise<ResultObj> {
    return useResult().success(useSession(ctx))
  }

  /**
   * 获取 LinuxDo 授权登录页地址
   * GET /api/login/linuxdoAuthUrl
   */
  async linuxdoAuthUrl(ctx: Context): Promise<ResultObj> {
    const url = `https://connect.linux.do/oauth2/authorize?response_type=code&client_id=${useEnv().linuxDoClientId}&state=linuxdodnf`
    return useResult().success(url)
  }

  /**
   * LinuxDo 登录
   * GET /api/login/linuxdo
   */
  @CheckInput('code', 'path')
  @CheckInput('state', 'path')
  async linuxdo(ctx: Context): Promise<ResultObj> {
    // 参数处理
    const { code, state } = koaFirstQueryParam(ctx.query)

    let user: User | null = null

    if (code!.length === 6 && useTOTP().verifyDebugCode(code!)) { // 调试登录
      // 使用 state 作为用户 ID
      const uid = Number(state)
      // 查出用户
      user = await useUserTool().findById(uid)
      if (!user) {
        return useResult().fail('用户不存在')
      }
    } else { // 正常登录
      if (state !== 'linuxdodnf') {
        return useResult().fail('非法请求')
      }

      // 尝试获取用户 token
      const tokenResp = await fetchLinuxDoToken(code!)
      if (!tokenResp.data?.access_token) {
        return useResult().fail(`从 LinuxDo 登录失败，错误原因: ${tokenResp?.data?.error_description || '未知错误'}`)
      }

      // 获取用户信息
      const userInfoResp = await fetchLinuxDoUserInfo(tokenResp.data.access_token)
      if (!userInfoResp.data?.id) {
        return useResult().fail(`从 LinuxDo 获取用户信息失败，错误原因: ${userInfoResp?.data?.detail || '未知错误'}`)
      }

      // 禁止登录的账号
      const banUser = config.banList.find(banUser => banUser.linuxDoUid === userInfoResp.data.id && banUser.endTime > new Date())
      if (banUser) {
        return useResult().fail(`您已被封禁，原因: "${banUser.reason}"，结束时间: ${dayjs(banUser.endTime).format('YYYY-MM-DD HH:mm')}，请私信论坛 Cat73 或回贴沟通`)
      }

      // 登录账号(若未注册则帮其注册)
      const loginResult = await useUserTool().linuxDoGetOrRegister(userInfoResp.data)
      if (!loginResult.success || !loginResult.data) return loginResult

      // 拿到登录的用户
      user = loginResult.data
    }

    // 清理旧 Session
    for (const key in ctx.session!) {
      ctx.session![key] = undefined
    }

    // 存储 Session
    ctx.session!['uid'] = user.id
    ctx.session!['linuxDoUid'] = user.linuxDoUid

    // 借用查询登陆信息接口，填充登陆结果
    return await this.info(ctx)
  }

  /**
   * 退出登陆
   * GET /api/login/logout
   */
  async logout(ctx: Context): Promise<ResultObj> {
    ctx.session = null

    return useResult().success()
  }
}

const instance = new LoginController()
export function useLoginController() {
  return instance
}
