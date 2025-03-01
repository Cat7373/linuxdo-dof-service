import { AxiosResponse } from 'axios'
import fetch from '../util/request.js'
import { useEnv } from '../util/env.js'
import qs from 'qs'

/**
 * LinuxDo 通过 code 获取 Token 接口的响应结构
 */
export interface LinuxDoTokenResp {
  access_token: string, // Token
  expires_in: number, // 过期时间
  refresh_token: string, // 刷新 Token
  token_type: string, // Token 类型

  error: string, // 错误码
  error_description: string, // 错误描述
}

/**
 * LinuxDo 通过 Token 获取用户信息接口的响应结构
 */
export interface LinuxDoUserInfoResp {
  id: number, // 用户 ID
  sub: string, // 未知参数，目前看是用户 ID 的字符串版
  username: string, // 用户名 (目前新用户三天内可修改，三天后不可修改)
  login: string, // 登录名
  name: string, // 用户昵称
  email: string, // 邮箱 (假的)
  avatar_template: string, // 头像模板
  avatar_url: string, // 头像 URL
  active: boolean, // 是否活跃
  trust_level: number, // 信任等级
  silenced: boolean, // 是否被禁言
  external_ids: any, // 外部 ID 清单 (数据结构及含义未知)
  api_key: string, // API Key (用途不明)

  detail: string, // 错误描述
}

/**
 * LinuxDo 通过 code 获取 Token 接口
 * @param code 授权码
 */
export async function fetchLinuxDoToken(code: string): Promise<AxiosResponse<LinuxDoTokenResp>> {
  const data = {
    grant_type: 'authorization_code',
    code,
  }

  try {
    return await fetch({
      url: 'https://connect.linux.do/oauth2/token',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${useEnv().linuxDoClientId}:${useEnv().linuxDoClientSecret}`).toString('base64')}`,
      },
      data: qs.stringify(data),
      method: 'POST',
    })
  } catch (error) {
    return (error as any).response // 让外面正常处理 LinuxDo 返回的 401
  }
}

/**
 * LinuxDo 通过 Token 获取用户信息接口
 * @param token Token
 */
export async function fetchLinuxDoUserInfo(token: string): Promise<AxiosResponse<LinuxDoUserInfoResp>> {
  try {
    return await fetch({
      url: 'https://connect.linux.do/api/user',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      method: 'GET',
    })
  } catch (error) {
    return (error as any).response // 让外面正常处理 LinuxDo 返回的 401
  }
}
