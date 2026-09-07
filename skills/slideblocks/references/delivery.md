# SlideBlocks Skill delivery

This reference documents the installed Skill client. Published Catalog entries, their exact Prompts, and available source packages can be retrieved without an account. The client establishes a signed anonymous delivery context automatically; account connection remains optional only for binding that same published delivery to a revocable account Session.

## English

### Install

The website presents one first-party install command:

```sh
curl -fsSL https://inteliway.tech/skill/install.sh | sh -s -- \
  --site https://inteliway.tech \
  --api https://api.inteliway.tech
```

The installer downloads `slideblocks.zip` and its SHA-256 document from the same HTTPS origin, verifies the exact bytes, rejects unsafe archive paths, and keeps one managed package. New installs use `$HOME/.agents/skills/slideblocks`; a secure existing SlideBlocks config may preserve another valid managed target. It detects supported local Agent hosts and creates only owned discovery links for Codex, Claude Code, Cursor, Gemini CLI, GitHub Copilot, OpenCode, Roo, Trae, Windsurf, CodeBuddy, and WorkBuddy. Hosts that are not present are not created, and conflicting unmanaged paths are never overwritten.

This shell installation is for supported local coding agents. Web, mobile, and cloud agents do not automatically read the user's local Skill directory; use the upload, plugin, or repository-scoped flow supported by that product. The `slideblocks` launcher is placed under `$HOME/.local/bin` by default. If that directory is not on `PATH`, run the client by its full installed path or add the directory to `PATH`.

For an explicitly authorized Staging check, keep the site and API in the same environment:

```sh
curl -fsSL https://staging.inteliway.tech/skill/install.sh | sh -s -- \
  --site https://staging.inteliway.tech \
  --api https://api.staging.inteliway.tech
```

Never send a Production token to Staging or a Staging token to Production. Changing either configured origin clears the locally stored delivery context and account token.

### Retrieve immediately; bind delivery to an account only when desired

No login step is required for published Artifacts. On the first `artifact get`, the client accepts one opaque, signed anonymous context from the configured API, stores only that context and its expiry in the mode-`0600` config, and retries the same idempotent request automatically. It never stores the Prompt body or signed source URL in the config.

Each signed anonymous context has a soft fairness allowance of 100 successful unlocks per Beijing day. Replacing the context creates a new accounting subject, so this is not an unbypassable device, person, IP, or network quota.

This anonymous path requires client `0.2.0` or newer. If an existing installation reports `0.1.x`, run `slideblocks skill update` once before retrieval.

Account connection remains available to bind the same published-Artifact delivery path to a revocable account Session. It does not broaden the current published Catalog or enable Creator, submission, private, unlisted, or administrative CLI access:

```sh
slideblocks login
slideblocks status
```

`login` prints a website URL and one-time code, then waits for approval. It never asks for a password in the terminal. The resulting bearer token is stored in `~/.config/slideblocks/config.json` with mode `0600`; it is never printed. The connected device is an ordinary revocable account Session. Connecting does not change which published Artifacts are available anonymously.

### Browse the public Catalog

```sh
slideblocks catalog search "architecture"
slideblocks catalog show blocks/architecture-flow/data-pipeline
```

These commands read the public Catalog v2 only. They do not download Prompt text or source bytes.

### Unlock one exact Artifact

```sh
slideblocks artifact get blocks/architecture-flow/data-pipeline
slideblocks artifact get blocks/architecture-flow/data-pipeline \
  --source ./data-pipeline.source.zip
```

The client sends one exact Artifact ID, version, content hash, and Prompt variant. It rejects coordinate drift before exposing the Prompt. Prompt text is written to standard output unless `--prompt FILE` is used. `--source FILE` consumes a short-lived source URL, verifies byte length and SHA-256, and saves the ZIP with mode `0600`. The signed URL is never printed or persisted.

Complete Deck and starter-project source packages contain editable source plus the offline builder, not a stale prebuilt release. After extraction, run `npm install` and `npm run dev` to edit or inspect the project. After the final change, run `npm run build:offline`; it creates one self-contained `offline.html`. Copy that file alone and double-click it to present in a current Chromium browser. The ordinary `npm run build` output is still an HTTP-hosted app and must not be described as `file://` compatible. `npm run build:portable` remains only as a static-HTTP compatibility path when present: copy and host the complete `portable/` directory. Block-only source packages are components and usage examples to integrate into the project created from their Prompt; they are not standalone decks, but the Prompt requires the resulting project to include the same offline handoff.

Historical retrieval requires both `--version VERSION` and `--hash sha256:HEX`; supplying only one is rejected. Use `--force` only when an explicitly named Prompt or source output may be replaced. `--json` includes the unlocked Prompt by design, so do not send its output to shared logs.

### Disconnect, update, and uninstall

```sh
slideblocks logout
slideblocks skill update
slideblocks skill uninstall
```

`logout` revokes the optional remote Session before removing the local account token; anonymous published-Artifact retrieval remains available. `logout --local` is an offline escape hatch and does **not** revoke the server Session; revoke it later from the website account page. Update and uninstall retrieve the installer from the configured HTTPS site and preserve the configured installation target. `slideblocks skill uninstall` also revokes the current device Session when one exists and removes the local client config before it reports success. A direct `install.sh --uninstall` only removes files, so disconnect first when using that maintenance escape hatch.

## 中文

### 安装

网站只展示一条第一方安装命令：

```sh
curl -fsSL https://inteliway.tech/skill/install.sh | sh -s -- \
  --site https://inteliway.tech \
  --api https://api.inteliway.tech
```

安装脚本会从同一个 HTTPS 域名下载 `slideblocks.zip` 和 SHA-256 文件，校验完整字节、拒绝危险压缩路径，并只保留一份受管软件包。新安装默认位于 `$HOME/.agents/skills/slideblocks`；安全的既有 SlideBlocks 配置可以继续沿用原受管目标。安装器会检测 Codex、Claude Code、Cursor、Gemini CLI、GitHub Copilot、OpenCode、Roo、Trae、Windsurf、CodeBuddy 和 WorkBuddy 等本地宿主，并且只为已经存在的宿主创建归本安装管理的发现链接；不会创建未安装宿主的目录，也不会覆盖无关路径。

这条 Shell 安装路径仅面向受支持的本地 coding agents。网页端、移动端和云端 Agent 不会自动读取用户电脑里的 Skill 目录；请改用对应产品支持的上传、Plugin 或仓库级安装方式。`slideblocks` 命令入口默认位于 `$HOME/.local/bin`。如果该目录不在 `PATH` 中，请使用完整路径运行客户端，或把该目录加入 `PATH`。

仅在明确授权的 Staging 验收中使用下面的命令，并确保网站与 API 属于同一环境：

```sh
curl -fsSL https://staging.inteliway.tech/skill/install.sh | sh -s -- \
  --site https://staging.inteliway.tech \
  --api https://api.staging.inteliway.tech
```

不要把 Production Token 发给 Staging，也不要把 Staging Token 发给 Production。只要修改任一服务地址，客户端就会清除本地匿名交付上下文与账户 Token。

### 安装后直接获取；按需把交付绑定到账户

获取已发布 Artifact 不需要先登录。匿名交付要求客户端 `0.2.0+`；`0.1.x` 客户端会收到 `CLIENT_UPGRADE_REQUIRED`，应先运行 `slideblocks skill update`。第一次运行 `artifact get` 时，客户端会从已配置 API 接收一个不透明的签名匿名上下文，仅把该上下文及其到期时间写入权限为 `0600` 的配置文件，再自动使用同一个幂等请求重试。Prompt 正文和签名源码链接都不会写入配置。

每个签名匿名上下文每天（北京时间）有 100 次成功解锁的软公平额度。替换匿名上下文会形成新的计量主体，因此这不是不可绕过的设备、个人、IP 或网络日限额。

账户连接只用于把同一条已发布 Artifact 交付路径绑定到可撤销账户 Session。它不会扩大当前已发布 Catalog，也不会为 CLI 开启 Creator、投稿、私有、未公开或管理访问：

```sh
slideblocks login
slideblocks status
```

`login` 会输出网页地址和一次性验证码，然后等待用户授权；终端不会收集密码。授权后的 Bearer Token 只保存在 `~/.config/slideblocks/config.json`，权限为 `0600`，不会打印到终端。这个设备对应一个可在账户页撤销的普通 Session。连接账户不会改变匿名用户可获取哪些已发布 Artifact。

### 浏览公开 Catalog

```sh
slideblocks catalog search "架构"
slideblocks catalog show blocks/architecture-flow/data-pipeline
```

这些命令只读取公开 Catalog v2，不会下载 Prompt 正文或源码字节。

### 解锁一个精确 Artifact

```sh
slideblocks artifact get blocks/architecture-flow/data-pipeline
slideblocks artifact get blocks/architecture-flow/data-pipeline \
  --source ./data-pipeline.source.zip
```

客户端会提交同一个 Artifact ID、版本、内容 Hash 和 Prompt 变体；只要坐标漂移，就会在输出 Prompt 前失败。默认把 Prompt 写到标准输出，也可使用 `--prompt 文件`。`--source 文件` 会使用短时源码链接，校验字节数和 SHA-256，再以 `0600` 权限保存 ZIP；签名链接不会被打印或持久化。

完整 Deck 和 Starter Project 源码包提供可编辑源码和离线构建器，不附带可能过期的预构建发布文件。解压后先运行 `npm install`，再用 `npm run dev` 编辑或查看；最后一次修改后运行 `npm run build:offline`，它会生成一个自包含的 `offline.html`。迁移时只需复制这个文件，并在当前 Chromium 浏览器中双击放映。普通 `npm run build` 仍是 HTTP 托管应用，不能宣称支持 `file://`。如果保留 `npm run build:portable`，它只用于兼容静态 HTTP 托管，必须复制完整的 `portable/` 目录。仅包含 Block 的源码包是组件和用法示例，需要集成进其 Prompt 创建的项目，并不是独立 Deck；其 Prompt 同样要求最终项目交付离线文件。

获取旧版本时必须同时提供 `--version 版本` 和 `--hash sha256:HEX`，只提供其中一个会被拒绝。只有在明确允许覆盖指定 Prompt 或源码文件时才使用 `--force`。`--json` 会按设计包含已解锁 Prompt，不要把它写入共享日志。

### 断开、更新与卸载

```sh
slideblocks logout
slideblocks skill update
slideblocks skill uninstall
```

`logout` 会先撤销可选的远端 Session，再删除本地账户 Token；匿名获取已发布 Artifact 仍然可用。`logout --local` 只用于离线应急，**不会**撤销服务器 Session；之后需要在网站账户页完成撤销。更新与卸载会从当前配置的 HTTPS 网站获取安装脚本，并沿用原安装目录。`slideblocks skill uninstall` 会在 Session 存在时撤销它，并在成功前删除本地客户端配置。直接运行 `install.sh --uninstall` 只删除文件，因此使用该维护兜底方式前应先断开登录。
