# 本次服务器部署

- 服务器：170.106.189.16，Ubuntu 24.04，SSH 用户 ubuntu。
- 项目目录：`/home/ubuntu/arc-invoice`。
- 原有 443 端口已有服务，本项目 HTTPS 使用 8443，不修改原有服务。
- 预定网站：https://170.106.189.16.sslip.io:8443
- 管理页面：https://170.106.189.16.sslip.io:8443/admin
- 收款钱包：`0xab9e4362ced96d403dab09e0561aded7b20e96d6`。

2026-10-10 已验证容器、正式 HTTPS 证书与公网访问正常，详情见 VALIDATION.md。公网 TCP 80 用于 Let's Encrypt HTTP 证书验证和跳转，8443 用于网站访问。原有 SSH 与 443 规则应保留。

首次配置：

```bash
cd /home/ubuntu/arc-invoice
bash scripts/configure-server.sh
sudo docker compose -f compose.yaml -f compose.https.yaml up -d --build
```

SSH 登录后，在自己的终端读取商户管理口令：

```bash
cd /home/ubuntu/arc-invoice
sed -n 's/^ADMIN_TOKEN=//p' .env
```

将它输入管理页面。不要把输出发送到聊天、截图或 GitHub。`.env` 的权限应为 600。如果共享了口令，生成新的管理口令并重启应用；同时更换 SESSION_SECRET 可以使旧会话失效。

运行检查：

```bash
sudo docker compose -f compose.yaml -f compose.https.yaml ps
sudo docker compose -f compose.yaml -f compose.https.yaml logs --tail=80 app proxy
```

更新代码后重新构建；保留 `.env` 和数据卷：

```bash
sudo docker compose -f compose.yaml -f compose.https.yaml up -d --build
```

创建 0.01 USDC 订单并使用另一个有余额的钱包付款，保留真实主网浏览器交易链接。资金操作由钱包持有人确认，程序部署不会自动执行付款。

## 推送 GitHub

在你的电脑或服务器上进入源码目录：

```bash
git init
git add .
git diff --cached --name-only
git commit -m "Build Arc Invoice payment demo"
git branch -M main
git remote add origin https://github.com/你的用户名/arc-invoice.git
git push -u origin main
```

先在 GitHub 创建空的公开仓库。确认暂存清单中没有 `.env`、数据库、私钥或口令。`.gitignore` 已排除环境文件、构建文件和数据目录。

申请前必须完成：网站公网 HTTPS 可访问、真实 Arc 主网付款并成功核验、公开仓库、开发者主页。在实际验证前不要宣称主网付款已完成。
