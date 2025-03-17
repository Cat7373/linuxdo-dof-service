import child_process from 'node:child_process'
import { useKnex } from "../../db/knex.js"
import { useLog } from '../../util/log.js'

let needRestart = true

/**
 * 跨零点时设置需要重启 Docker
 */
export const setNeedRestartFlag = async () => {
  needRestart = true
}

/**
 * 每日自动重启 Docker (每次重启本服务后也会)
 */
export const restartDocker = async () => {
  if (needRestart) {
    // 判断服务器是否有人
    const onlineDnfUserList = (await useKnex().raw(`SELECT * FROM taiwan_login.login_account_3 WHERE login_status = 1`))[0]
    if (onlineDnfUserList.length > 0) {
      return // 服务器有人，放弃重启
    }

    // 执行命令，重启 Docker 容器
    useLog().info('RestartDocker', '准备重启 DNF 服务')
    child_process.execSync(`docker restart dnf`)
    useLog().info('RestartDocker', 'DNF 服务重启完成')

    // 标记今天已经重启过了
    needRestart = false
  }
}
