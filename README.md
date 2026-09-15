# Paper Reading Guide

一個專門用來讀 **英文學術論文** 的 GitHub Pages 靜態網站。

核心閱讀框架：

**Problem → Gap → Data → Method → Finding → Limitation → My Use**

## 功能

- 7 步驟引導閱讀
- 每一步都有中英對照問題
- 英文論文常見句型提示
- 1-minute synthesis
- Level 1–4 理解程度檢核
- localStorage 自動儲存
- 匯出 Markdown
- JSON 備份 / 匯入
- 深色模式
- PWA，可加入 iPhone 主畫面

## 部署到 GitHub Pages

1. 在 GitHub 建立一個新的 repository，例如：
   `paper-reading-guide`
2. 把這個資料夾內的所有檔案上傳到 repository 根目錄。
3. 到 GitHub repository：
   **Settings → Pages**
4. 在 **Build and deployment**：
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
5. 儲存後，GitHub 會產生網站網址。

通常網址會是：

`https://你的GitHub帳號.github.io/paper-reading-guide/`

## iPhone 加到主畫面

用 Safari 開啟 GitHub Pages 網站後：

**分享 → 加入主畫面**

之後就會像 App 一樣開啟。

## 資料儲存注意

所有筆記預設存在瀏覽器的 `localStorage`。

如果更換手機、瀏覽器，或清除網站資料，筆記不會自動同步。
建議重要論文閱讀完後下載 Markdown 或 JSON 備份。
