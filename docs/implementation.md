# 最小構成の実装記録

2026-09-13確認。マムガール、オーキッド占星術師、ゲーム紹介を使い、画像読取からデータ・記事・画像加工・静的build・ローカル表示まで一巡した。外部公開、Git初期化、commit、pushは未実施。

## 追加したファイル

| 場所 | 追加内容 |
|---|---|
| ルート | AGENTS.md、README.md、.gitignore、package.json、package-lock.json、astro.config.mjs、tsconfig.json |
| data/ | minions/mam-girl.yaml、minions/orchid-astrologer.yaml、keywords.yaml、sources.yaml、assets.yaml |
| content/ | mam-girl.md、orchid-astrologer.md、about.md |
| lib/ | schema.mjs、content.mjs |
| src/ | content.config.ts、lib/site.ts、layouts/Layout.astro、components/Fact.astro・Form.astro、styles/global.css、pages/index.astro・minions/index.astro・minions/[id].astro・guides/[id].astro |
| scripts/ | inventory.mjs、image-core.mjs、images.mjs、validate.mjs、check-build.mjs、review.mjs |
| tests/ | pipeline.test.mjs |
| docs/ | workflow.md、data-model.md、本記録 |
| public/ | favicon.svg、images以下の公開用WebP 7枚 |
| work/（非公開） | sources.yaml、recipes.yaml、processed以下の加工確認画像、review.md |
| .github/workflows/ | pages.yml（手動実行のみ） |

仕様書・元メモ・原本には編集を行っていない。このフォルダはGitリポジトリではないため、過去commitに対する差分一覧は存在しない。今回の再開では既存実装を再検証し、READMEへpreview終了方法を追記、確認票を再生成、本記録を追加した。

## 構成上の判断

- YAMLをミニオン・用語・画像参照の正本、Markdownを攻略本文の正本とした。性能表はYAMLから表示するため二重入力しない。
- observed / manual / derived / unknown / absentを区別。画像確認値は根拠ID、人間の補完値は確認記録、逆算値は式と前提を持つ。
- 基本形と各バリアントで星別性能・Lvボーナスを分け、詳細画面のLvと育成画面のLvを別に保持する。
- rawは任意のファイル名で非公開。1枚の一覧画像から2体のアイコンを切り出す構成を実証した。
- Workが分類と読み取りを行い、スクリプトが確定した加工設定を実行する。AI APIや無人OCRの契約は不要。
- 原本座標で不透明黒塗り、トリミング、縮小、WebP化。加工確認用と公開用を分離した。
- buildは保存済みの正本と公開画像を読む。元メモから記事を再生成する処理はない。
- Pages公開物はdistのみ。raw・work・記事メモは公開用リポジトリの管理対象から除外する。

## 検証

- 5件のテストが成功。状態の区別、星重複、矛盾するバリアント状態、実画像の黒塗り・サイズ・範囲外指定、出力先制限等を確認。
- 2体・3記事・7画像の形式と参照検証が成功。未確認15項目は公開を妨げず、work/review.mdに位置と根拠を記録。
- 5ページをbuild。画像・内部リンク・アンカー・非公開素材混入の検証が成功。
- 前回作業で /plants-on-fire-guide のサブパスbuildも成功。
- 実ブラウザで一覧検索、条件不一致、解除、並び替え、詳細表示を確認。390px幅で詳細表と紹介記事を確認。
- 公開用7画像は前回作業で個別に目視。マスク済み対戦画像も確認済み。公開前にはユーザーによる最終確認を行う。
- GitHub Actions上の実行と実際のPages配信は未検証。公開指示後の作業になる。

## 残っているユーザー作業

日常入力はスクリーンショットと攻略判断の短いメモ。画面外の特殊条件のみ補足する。Workが変更案を用意した後、数値、未確認・逆算の扱い、攻略本文、加工画像、最終画面を確認する。原本・メモ・workは別途非公開バックアップを行う。

現在は初期能力、表示補正、基本形とバリアントのLv表示の関係などを未確認としている。これらをすべて埋めるまで公開を待つ必要はないが、記載条件の妥当性は人間が確認する。

## 今回見送ったものと今後の改善

未採用の2体の素材処理、自動OCR/API、常時監視、CMS、DB、ログイン、全Lv計算、全文検索、広告・解析、複雑な承認・ハッシュ管理は未実装。

まず残り2体の追加で同じ手順の使い勝手を確認する。その後、必要が出た場合だけ複数撮影レベルの観測セット、攻略評価のモード別基準、画像の本文内配置を追加する。現モデルは1形態につき1組の撮影条件を扱うため、異なるLvの星別画像を混在させない。

新しい1体の具体的な追加手順はworkflow.md、YAML・Markdownの例はdata-model.mdを参照。既存正本を先に読み、追加分だけ更新する。
