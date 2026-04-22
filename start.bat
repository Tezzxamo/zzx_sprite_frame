@echo off
chcp 65001 >nul
title ZZX SpriteFrame 启动工具
color 0B

setlocal EnableDelayedExpansion

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

:CHECK_NODE
echo [检查] Node.js 环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js (推荐 v18+)
    pause
    goto MENU
)
echo [通过] Node.js 版本: 
node --version
echo.
goto :EOF

:CHECK_DEPS
echo [检查] 项目依赖...
if not exist "node_modules" (
    echo [提示] 未检测到 node_modules，将自动安装依赖...
    call :INSTALL
)
goto :EOF

:DEV
call :CHECK_NODE
call :CHECK_DEPS
cls
echo ============================================
echo     正在启动开发模式...
echo     按 Ctrl+C 停止服务器
echo ============================================
echo.
npx electron-vite dev
pause
goto MENU

:TYPECHECK
call :CHECK_NODE
call :CHECK_DEPS
cls
echo ============================================
echo     正在运行类型检查...
echo ============================================
echo.
npx tsc --noEmit -p tsconfig.json --composite false
if errorlevel 1 (
    echo.
    echo [失败] 类型检查未通过，请修复错误后再构建。
) else (
    echo.
    echo [通过] 类型检查全部通过！
)
pause
goto MENU

:BUILD
call :CHECK_NODE
call :CHECK_DEPS
cls
echo ============================================
echo     正在构建生产版本...
echo ============================================
echo.
npx electron-vite build
if errorlevel 1 (
    echo.
    echo [失败] 构建失败，请检查错误信息。
) else (
    echo.
    echo [成功] 构建完成！输出目录: out/
)
pause
goto MENU

:DIST
call :CHECK_NODE
call :CHECK_DEPS
cls
echo ============================================
echo     正在打包 Windows 安装包...
echo     这可能需要几分钟...
echo ============================================
echo.
npm run dist:win
if errorlevel 1 (
    echo.
    echo [失败] 打包失败，请检查错误信息。
) else (
    echo.
    echo [成功] 打包完成！输出目录: dist/
)
pause
goto MENU

:INSTALL
call :CHECK_NODE
cls
echo ============================================
echo     正在安装依赖...
echo     首次安装可能需要 1-3 分钟
echo ============================================
echo.
npm install --registry=https://registry.npmmirror.com
if errorlevel 1 (
    echo.
    echo [失败] 依赖安装失败，请检查网络连接。
) else (
    echo.
    echo [成功] 依赖安装完成！
)
pause
goto MENU

:EXIT
echo 感谢使用 ZZX SpriteFrame！
timeout /t 1 >nul
exit /b 0
