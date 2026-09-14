# プランツ・オン・ファイア攻略ガイド

画像と短い攻略メモから更新する、Astro製の静的サイトです。現在はマムガール、オーキッド占星術師、ゲーム紹介を掲載する最小構成です。

## ローカルで確認

Node.js 22.12以上（推奨24）を使用します。プロジェクト直下で実行してください。

```sh
npm ci
npm run build
npm run preview
```

previewで表示されたローカルURLを開きます。通常は http://127.0.0.1:4321/ です。公開用WebPは保存済みなので、buildに原本・AI・Workは必要ありません。

通常の前面実行は Ctrl+C で終了します。Workからの実行などでバックグラウンド起動した場合は `npx astro preview status` で状態確認、`npx astro preview stop` で終了します。別のbaseや出力フォルダを試す前に、実行中のpreviewを終了してください。

開発中は `npm run dev`。確認票は `npm run review` で `work/review.md` に生成します。

## 構成

```text
raw-screenshots/       非公開原本（元ファイル名のまま・変更しない）
article-notes/         非公開の入力メモ（変更しない）
work/                 非公開の分類台帳・加工設定・確認用画像・確認票
data/minions/         ミニオン共通データの正本（YAML）
data/keywords.yaml    共通用語
data/rumble-chess.yaml ランブルチェスの絆所属・任意の詳細観測（保存のみ・サイト未使用）
data/sources.yaml     根拠IDと説明（原本パスは入れない）
data/assets.yaml      公開画像ID・相対パス・代替文
content/              公開用記事の正本（Markdown）
lib/                  共通スキーマと読み込み
src/                  Astroページ・共通表示・CSS
public/images/        加工済みWebP（Git管理する）
scripts/              画像処理・検証・確認票
tests/                重要なデータ状態・画像処理の検証
docs/                 制作・運用手順
.github/workflows/    手動実行のGitHub Pages公開
dist/                 build出力（自動生成・Git対象外）
```

仕様書と元メモ・原本は保持しています。raw-screenshots、article-notes、work、.obsidian は .gitignore で除外しています。`.gitignore` はバックアップではありません。これらの制作素材は非公開ストレージへ別途バックアップしてください。既にGit追跡済みの素材がある環境ではignoreだけで追跡解除されないため、公開前に確認してください。

## 日常の作業

1. 原本スクリーンショットと短い攻略メモを追加。
2. Workへ今回分の分類・読み取り・差分更新を依頼。
3. Workが `work/sources.yaml`、`work/recipes.yaml`、公開データ・記事を必要箇所だけ更新。
4. `npm run images` で加工後画像を確認。目視確認後 `npm run images:publish`。
5. `npm run review`、`npm test`、`npm run build`、`npm run preview`。
6. 人間が数値・攻略文・画像・画面を確認して公開判断。

分類と文字の読み取りを行う無人OCRコマンドはありません。Workの画像確認がその工程です。スクリプトは確定した設定を実行します。詳細は [制作手順](docs/workflow.md) と [データ形式](docs/data-model.md) を参照。

## GitHub Pages

現時点でGitの初期化・commit・push・外部公開は行っていません。

1. 公開可能なファイルだけを含むGitHubリポジトリを用意する。
2. GitHubの Settings → Pages → Source を GitHub Actions に設定。
3. 内容確認後、Actions → Publish GitHub Pages → Run workflow を実行。

pushでは公開されません。ワークフローは手動実行のみです。GitHub Pagesの設定からサイトのorigin/base_pathを取得し、`dist`だけを配信します。一般のプロジェクトサイトとユーザーサイトの両方を想定しています。

独自ドメインなどを手動buildする場合は `SITE_URL` と `BASE_PATH` で変更できます。記事や画像のリンクへリポジトリ名を直書きしていません。

PowerShellでサブパスを試す例（現在のシェル内だけの設定）:

```powershell
$env:BASE_PATH = '/plants-on-fire-guide'
$env:BUILD_DIR = 'dist-subpath'
npm run build
npm run preview
# 確認を終えてサーバーを止めた後
Remove-Item Env:BASE_PATH
Remove-Item Env:BUILD_DIR
```

## 今回の範囲

- 5ページ（トップ・一覧・2体詳細・紹介）、7枚のWebP。
- 一覧の名前検索、レアリティ・コスト・評価フィルタ、並び替え。
- 基本形・バリアント別の星別表示値とLvボーナス。
- 未確認のまま掲載可能。逆算値には前提を表示。
- 原本を含まない通常build、画像参照と内部リンク検証。
- 未実装：全文検索、広告、アクセス解析、CMS、DB、ログイン、自動OCR/API、常時監視、全レベル計算。

画像内のカードアイコンには撮影時のLvが残ります。ステータスの基準はページ内の表示条件です。バリアント画面のLvの意味、外部補正、最低レベル能力など、未確認事項は確認票に記録しています。最終公開判断は未実施です。
