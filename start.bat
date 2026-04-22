@echo off
chcp 65001 >nul
title ZZX SpriteFrame 启动工具
color 0B

:MENU
cls
echo ============================================
echo     ZZX SpriteFrame - 视频转序列帧工具
echo ============================================
echo.
echo  [1] 开发模式启动 (npm run dev)
echo  [2] 类型检查 (npm run typecheck)
echo  [3] 生产构建 (npm run build)
echo  [4] 打包 Windows 安装包 (npm run dist:win)
echo  [5] 安装/更新依赖 (npm install)
echo  [0] 退出
echo.
echo ============================================
set /p choice="请选择操作 [0-5]: "

if "%choice%"=="1" goto DEV
if "%choice%"=="2" goto TYPECHECK
if "%choice%"=="3" goto BUILD
if "%choice%"=="4" goto DIST
if "%choice%"=="5" goto INSTALL
if "%choice%"=="0" goto EXIT

echo 无效选择，请重试...
timeout /t 2 >nul
goto MENU

REM ============================================================
REM  开发模式启动
REM ============================================================
:DEV
echo [检查] Node.js 环境...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js (推荐 v18+)
    echo        下载地址: https://nodejs.org/
    pause
    goto MENU
)
for /f "tokens=*" %%a in ('node --version') do echo [通过] Node.js 版本: %%a

echo [检查] 项目依赖...
if not exist "node_modules" (
    echo [提示] 未检测到 node_modules，将自动安装依赖...
    npm install --registry=https://registry.npmmirror.com
    if %errorlevel% neq 0 (
        echo [失败] 依赖安装失败，请检查网络连接。
        pause
        goto MENU
    )
    echo [成功] 依赖安装完成！
) else (
    echo [通过] 依赖已安装
)

cls
echo ============================================
echo     正在启动开发模式...
echo     按 Ctrl+C 停止服务器
echo ============================================
echo.
npm run dev
if %errorlevel% neq 0 (
    echo.
    echo [失败] 开发模式启动失败，请检查上面的错误信息。
)
pause
goto MENU

REM ============================================================
REM  类型检查
REM ============================================================
:TYPECHECK
echo [检查] Node.js 环境...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js
    pause
    goto MENU
)

echo [检查] 项目依赖...
if not exist "node_modules" (
    echo [错误] 未检测到 node_modules，请先安装依赖 (选项 5)
    pause
    goto MENU
)

cls
echo ============================================
echo     正在运行类型检查...
echo ============================================
echo.
npm run typecheck
if %errorlevel% neq 0 (
    echo.
    echo [失败] 类型检查未通过，请修复错误后再构建。
) else (
    echo.
    echo [通过] 类型检查全部通过！
)
pause
goto MENU

REM ============================================================
REM  生产构建
REM ============================================================
:BUILD
echo [检查] Node.js 环境...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js
    pause
    goto MENU
)

echo [检查] 项目依赖...
if not exist "node_modules" (
    echo [错误] 未检测到 node_modules，请先安装依赖 (选项 5)
    pause
    goto MENU
)

cls
echo ============================================
echo     正在构建生产版本...
echo ============================================
echo.
npm run build
if %errorlevel% neq 0 (
    echo.
    echo [失败] 构建失败，请检查错误信息。
) else (
    echo.
    echo [成功] 构建完成！输出目录: out/
)
pause
goto MENU

REM ============================================================
REM  打包安装包
REM ============================================================
:DIST
echo [检查] Node.js 环境...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js
    pause
    goto MENU
)

echo [检查] 项目依赖...
if not exist "node_modules" (
    echo [错误] 未检测到 node_modules，请先安装依赖 (选项 5)
    pause
    goto MENU
)

cls
echo ============================================
echo     正在打包 Windows 安装包...
echo     这可能需要几分钟...
echo ============================================
echo.
npm run dist:win
if %errorlevel% neq 0 (
    echo.
    echo [失败] 打包失败，请检查错误信息。
) else (
    echo.
    echo [成功] 打包完成！输出目录: dist/
)
pause
goto MENU

REM ============================================================
REM  安装依赖
REM ============================================================
:INSTALL
echo [检查] Node.js 环境...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js
    pause
    goto MENU
)

cls
echo ============================================
echo     正在安装依赖...
echo     首次安装可能需要 1-3 分钟
echo ============================================
echo.
npm install --registry=https://registry.npmmirror.com
if %errorlevel% neq 0 (
    echo.
    echo [失败] 依赖安装失败，请检查网络连接。
) else (
    echo.
    echo [成功] 依赖安装完成！
)
pause
goto MENU

REM ============================================================
REM  退出
REM ============================================================
:EXIT
echo 感谢使用 ZZX SpriteFrame！
timeout /t 1 >nul
exit /b 0
