# LinuxDo DOF Service
LinuxDo DOF - 服务端

## 安装配置
1. 安装 NodeJS(>= 21.0)
2. 运行 `pnpm install`
3. 修改 `src/config/index.ts` 中的配置
4. 修改 `.env` 中的配置

## 开发调试
1. 运行 `pnpm run start` 启动测试服务
2. 数据库 ORM 相关指令：

   ```sh
   # 将数据库的表结构同步到 schema.prisma 中
   npx prisma db pull
   # 将 schema.prisma 中的表结构同步到数据库中（增量，特殊情况下，可能要删掉现有库和 prisma/migrations 才能成功）
   npx prisma migrate dev --name init
   # 修改 schema.prisma，重新生成 TS 结构定义文件
   npx prisma generate
   # 自动格式化 schema.prisma
   npx prisma format
   # 启动内置的数据库连接工具
   npx prisma studio
   ```

## 生产服务
> 参考: https://pm2.keymetrics.io/docs/usage/quick-start
>
> 重要：运行 `pm2 set pm2-logrotate:max_size 4G` 来限制最大日志大小

1. 运行 `npm i -g pm2` 安装 pm2 进程管理器
2. 通过全局环境变量 PROD_DB_PASSWD 设置数据库密码
3. 服务管理:
   1. 启动服务: `pm2 start ecosystem.config.cjs`
   2. 查询服务列表: `pm2 ls`
   3. 重启服务: `pm2 restart {name}`，请勿使用 reload
   4. 停止服务: `pm2 stop {name}`
   5. 删除服务: `pm2 delete {name}`
4. 日志查看:
   1. 查看日志: `pm2 logs {name}`
   2. 查看更多日志: `pm2 logs {name} --lines 1000`
   3. 查看错误日志: `pm2 logs {name} --err`
5. 开机启动:
   1. 设置开机自动启动: `pm2 startup`，然后按照指令输出指引操作
   2. 保存当前服务列表: `pm2 save`
6. 其他:
   1. 打开 GUI 监控工具: `pm2 monit`
   2. 升级全局 pm2 后刷新服务: `pm2 update`
