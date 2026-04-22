#Requires -Version 5.1
<#
.SYNOPSIS
    ZZX SpriteFrame 启动脚本
.DESCRIPTION
    提供开发模式、类型检查、构建、打包等一键操作
.EXAMPLE
    .\start.ps1
#>

$Host.UI.RawUI.WindowTitle = "ZZX SpriteFrame 启动工具"

# 颜色配置
$Colors = @{
    Primary   = "Cyan"
    Success   = "Green"
    Warning   = "Yellow"
    Error     = "Red"
    Info      = "White"
    Muted     = "Gray"
}

function Write-Banner {
    Clear-Host
    Write-Host "============================================" -ForegroundColor $Colors.Primary
    Write-Host "    ZZX SpriteFrame - 视频转序列帧工具    " -ForegroundColor $Colors.Primary
    Write-Host "============================================" -ForegroundColor $Colors.Primary
    Write-Host ""
}

function Show-Menu {
    Write-Banner
    Write-Host "  [1] " -NoNewline; Write-Host "开发模式启动    " -ForegroundColor $Colors.Success -NoNewline; Write-Host "npm run dev"
    Write-Host "  [2] " -NoNewline; Write-Host "类型检查        " -ForegroundColor $Colors.Warning -NoNewline; Write-Host "npm run typecheck"
    Write-Host "  [3] " -NoNewline; Write-Host "生产构建        " -ForegroundColor $Colors.Info    -NoNewline; Write-Host "npm run build"
    Write-Host "  [4] " -NoNewline; Write-Host "打包安装包(Win) " -ForegroundColor $Colors.Primary -NoNewline; Write-Host "npm run dist:win"
    Write-Host "  [5] " -NoNewline; Write-Host "安装/更新依赖   " -ForegroundColor $Colors.Muted   -NoNewline; Write-Host "npm install"
    Write-Host "  [0] " -NoNewline; Write-Host "退出"
    Write-Host ""
    Write-Host "============================================" -ForegroundColor $Colors.Primary
}

function Test-NodeEnvironment {
    Write-Host "[检查] Node.js 环境..." -ForegroundColor $Colors.Muted -NoNewline
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -ne 0) { throw }
        Write-Host " ✓ $nodeVersion" -ForegroundColor $Colors.Success
        return $true
    }
    catch {
        Write-Host " ✗ 未检测到 Node.js" -ForegroundColor $Colors.Error
        Write-Host "[错误] 请先安装 Node.js (推荐 v18+): https://nodejs.org/" -ForegroundColor $Colors.Error
        return $false
    }
}

function Test-Dependencies {
    Write-Host "[检查] 项目依赖..." -ForegroundColor $Colors.Muted -NoNewline
    if (-not (Test-Path "node_modules")) {
        Write-Host " ✗ 未安装" -ForegroundColor $Colors.Warning
        Write-Host "[提示] 将自动安装依赖..." -ForegroundColor $Colors.Warning
        return Invoke-DependencyInstall
    }
    Write-Host " ✓ 已安装" -ForegroundColor $Colors.Success
    return $true
}

function Invoke-DependencyInstall {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor $Colors.Primary
    Write-Host "     正在安装依赖..." -ForegroundColor $Colors.Primary
    Write-Host "     首次安装可能需要 1-3 分钟" -ForegroundColor $Colors.Muted
    Write-Host "============================================" -ForegroundColor $Colors.Primary
    Write-Host ""

    npm install --registry=https://registry.npmmirror.com
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[失败] 依赖安装失败，请检查网络连接。" -ForegroundColor $Colors.Error
        return $false
    }
    Write-Host ""
    Write-Host "[成功] 依赖安装完成！" -ForegroundColor $Colors.Success
    return $true
}

function Start-DevMode {
    if (-not (Test-NodeEnvironment)) { pause; return }
    if (-not (Test-Dependencies)) { pause; return }

    Clear-Host
    Write-Host "============================================" -ForegroundColor $Colors.Primary
    Write-Host "     正在启动开发模式..." -ForegroundColor $Colors.Primary
    Write-Host "     按 Ctrl+C 停止服务器" -ForegroundColor $Colors.Muted
    Write-Host "============================================" -ForegroundColor $Colors.Primary
    Write-Host ""

    try {
        npx electron-vite dev
    }
    finally {
        Write-Host ""
        Write-Host "[信息] 开发服务器已停止" -ForegroundColor $Colors.Muted
        pause
    }
}

function Invoke-TypeCheck {
    if (-not (Test-NodeEnvironment)) { pause; return }
    if (-not (Test-Dependencies)) { pause; return }

    Clear-Host
    Write-Host "============================================" -ForegroundColor $Colors.Primary
    Write-Host "     正在运行类型检查..." -ForegroundColor $Colors.Primary
    Write-Host "============================================" -ForegroundColor $Colors.Primary
    Write-Host ""

    npx tsc --noEmit -p tsconfig.json --composite false
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[失败] 类型检查未通过，请修复错误后再构建。" -ForegroundColor $Colors.Error
    }
    else {
        Write-Host ""
        Write-Host "[通过] 类型检查全部通过！" -ForegroundColor $Colors.Success
    }
    pause
}

function Invoke-ProductionBuild {
    if (-not (Test-NodeEnvironment)) { pause; return }
    if (-not (Test-Dependencies)) { pause; return }

    Clear-Host
    Write-Host "============================================" -ForegroundColor $Colors.Primary
    Write-Host "     正在构建生产版本..." -ForegroundColor $Colors.Primary
    Write-Host "============================================" -ForegroundColor $Colors.Primary
    Write-Host ""

    npx electron-vite build
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[失败] 构建失败，请检查错误信息。" -ForegroundColor $Colors.Error
    }
    else {
        Write-Host ""
        Write-Host "[成功] 构建完成！输出目录: out/" -ForegroundColor $Colors.Success
    }
    pause
}

function Invoke-PackageBuild {
    if (-not (Test-NodeEnvironment)) { pause; return }
    if (-not (Test-Dependencies)) { pause; return }

    Clear-Host
    Write-Host "============================================" -ForegroundColor $Colors.Primary
    Write-Host "     正在打包 Windows 安装包..." -ForegroundColor $Colors.Primary
    Write-Host "     这可能需要几分钟..." -ForegroundColor $Colors.Muted
    Write-Host "============================================" -ForegroundColor $Colors.Primary
    Write-Host ""

    npm run dist:win
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[失败] 打包失败，请检查错误信息。" -ForegroundColor $Colors.Error
    }
    else {
        Write-Host ""
        Write-Host "[成功] 打包完成！输出目录: dist/" -ForegroundColor $Colors.Success
    }
    pause
}

# 主循环
while ($true) {
    Show-Menu
    $choice = Read-Host "请选择操作 [0-5]"

    switch ($choice) {
        "1" { Start-DevMode }
        "2" { Invoke-TypeCheck }
        "3" { Invoke-ProductionBuild }
        "4" { Invoke-PackageBuild }
        "5" {
            if (Test-NodeEnvironment) {
                Invoke-DependencyInstall | Out-Null
                pause
            }
        }
        "0" {
            Write-Host ""
            Write-Host "感谢使用 ZZX SpriteFrame！" -ForegroundColor $Colors.Success
            Start-Sleep -Seconds 1
            exit 0
        }
        default {
            Write-Host ""
            Write-Host "无效选择，请重试..." -ForegroundColor $Colors.Warning
            Start-Sleep -Seconds 2
        }
    }
}
