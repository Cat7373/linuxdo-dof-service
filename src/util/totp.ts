import OTP from 'otp'
import { useEnv } from './env.js'

/**
 * 调试用 TOTP 两步验证工具类
 */
class TOTP {
  // @ts-ignore
  private readonly otp: OTP

  constructor(secret: string) {
    // @ts-ignore
    this.otp = new OTP(secret)
  }

  /**
   * 验证代码
   * @param code 代码
   * @returns 代码是否为合法的调试密码
   */
  verifyDebugCode(code: string) {
    const now = Date.now()
    const trimCode = code.trim()

    // 约 1 / 50w 概率的安全风险，基本可忽略不计
    const codes = [
      this.otp.totp(now),
      this.otp.totp(now - 30000),
    ]

    return useEnv().debug && codes.some(c => c === trimCode)
  }

  /**
   * 生成登陆任意账号的验证码
   * @returns 验证码
   */
  genLoginCode() {
    return this.otp.totp(Date.now())
  }
}

// otpauth://totp/Dev?secret=MFKGGOKTIRITKULY&issuer=ycs
const instance = new TOTP(useEnv().totpKey)
export function useTOTP() {
  return instance
}
