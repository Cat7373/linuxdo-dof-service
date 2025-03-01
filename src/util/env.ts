import { configDotenv } from "dotenv"

/**
 * 禁止输入为空，为空就报错
 * @param input 输入字符串
 * @returns 非空的字符串
 */
function nn(input: string | undefined) {
  if (!input) throw new Error('请检查 .env 中是否缺少必要配置')
  return input
}

configDotenv()
const env = {
  // Koa Session Secret
  httpSecret: nn(process.env['HTTP_SECRET']),

  // LinuxDo Client ID
  linuxDoClientId: nn(process.env['LINUX_DO_CLIENT_ID']),
  // LinuxDo Client Secret
  linuxDoClientSecret: nn(process.env['LINUX_DO_CLIENT_SECRET']),
}

export function useEnv() {
  return env
}
