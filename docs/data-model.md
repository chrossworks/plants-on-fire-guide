# データ形式

## 正本

- ミニオン：`data/minions/<id>.yaml`
- 攻略文：`content/<id>.md`
- 用語：`data/keywords.yaml`
- 検証スキーマ：`lib/schema.mjs`

YAMLとMarkdownは手で追加・修正できる。buildは読み取りのみ。AIや元画像が利用できなくても公開サイトを再生成できる。

## 値の状態

```yaml
attack:
  status: observed
  value: 6
  sources: [mam-base]
```

| status | 意味 | 必要な内容 |
|---|---|---|
| observed | 画像で直接確認 | value、sources |
| manual | 人間が後から確認・追記 | value、sources（確認方法の説明をsources台帳へ） |
| derived | 条件付き計算値 | value、sources、formula、assumption |
| unknown | 未確認 | reason。valueを持たない |
| absent | 存在しないことを確認 | reason、sources。valueを持たない |

unknownもabsentも0に変換しない。manualは初期値の追記等に使用できる。例：初期攻撃力が実機で分かったら、base.initial.attackのstatusをmanual、valueを確認値、sourcesを確認記録IDに更新する。逆算値を直接確認値のように表示しない。

公開画面ではobservedとmanualはどちらも値だけを表示する。「追記確認」などの確認経路やAI・画像認識による制作方法は表示しない。statusとsourcesは管理・更新のために保存し、確認票で参照する。unknownは「未確認」、absentは「なし」、derivedは「条件付き逆算」と式・前提を表示する。

## レベルと星

基本形・バリアントの公開表はinitialの攻撃力と星別能力を項目単位で優先する。observed/manual/derivedは値のみを表示し、unknownの項目だけbase.starsの撮影値に切り替え、補完した項目と撮影条件を注記する。攻撃間隔・対象はbase.starsを使う。初期性能の別表は出さず、全項目が揃えば撮影条件の注記も出さない。基本形のinitial由来のderivedは式・ラベルを画面に出さず、正本と確認票に保持する。initialのabsentは検証エラー。バリアントにも同じ項目単位の最低レベル優先表示を適用する。

レアリティ最低レベルは `lib/schema.mjs` の `minimumLevels` に一元化（ユーザーの確認情報）。レア1・エピック4・レジェンド7。

`base` と `variants.items[]` は共通の形を持つ。

- displayLevel：詳細画面に表示されたLv。
- upgradeScreenLevel：その形態の育成一覧に表示された現在Lv。
- conditions：補正・表示条件・不明点。
- stars：星1/2/3。各星にstats（attack/interval/target）とability（text/keywords）。同じ値でも星ごとの根拠を保存。
- initial：最低レベル・育成前の攻撃力と星別能力。確認できない限りunknown。
- bonuses：到達Lvごとの変更。
- bonusCoverage：確認したLv範囲。範囲内に行がなければエラー。行の値自体はunknownでもよい。
- acquisition：その形態の入手方法。

攻撃間隔は、通常詳細で「0秒」「攻撃不可」の組み合わせを確認した場合に限り0を保存できる。未確認の代用にはしない。一覧用アイコンの適切な素材がない場合はiconを省略し、一覧では「準備中」と表示する。立ち絵やバリアント切り替え欄をアイコンの代用にしない。

基本形のみ `base.poolUnlock` を必須で持つ（文字列のfact）。入手方法欄でカードプール解放条件を確認した場合はobservedで記録し、トロフィーは「トロフィー20」のように文字で統一する。入手方法欄全体が見えていて解放の記載がない場合は、根拠画像と理由を付けてabsent（解放条件なし）。入手方法欄が写った画像がない場合はunknown。バリアントにはこの項目を保存せず、ページにも表示しない。

マムガールⅠは詳細Lv.6、育成一覧の現在Lv.1が写っている。関係は未確認のため別々に保存し、能力値をバリアントLv.1の値として扱わない。最低レベル規則からバリアント独自の育成値を自動補正しない。

現在の最小モデルは、1形態につき1組の表示レベル・星1〜3を収録する。別レベルのデータを併存させる必要が出たら観測セットを配列化する。異なる条件の星を同じセットに混ぜない。

## Lvボーナス

```yaml
- level: 4
  effect:
    status: observed
    value:
      text: 攻撃力ボーナスが4に上昇する
      operation: ability_set
      value: 4
      unit: points
    sources: [mam-up1]
```

attack_add（攻撃力加算）、ability_set（能力値変更）、text（条件変更等）を区別。原文は必ず残す。percentは百分率の数値を保存する（12%なら12）。ここから全星・全レベルを自動計算しない。

## バリアントの有無

- observed：1件以上の確認済みバリアントをitemsに収録。
- unknown：確認資料不足。itemsは空。
- absent：存在しないことを確認。itemsは空。noteに確認根拠を書く。
- absentではsourcesも必須。通常詳細画面と分類され、variantControl: absentを記録した画像根拠が最低1件必要。ランブルチェス画像の非表示は使用できない。

observedでも全種類の網羅を意味しない。noteに収録範囲を記載する。カードのS/SSはcardRank、攻略上のS/SSはevaluation.rankとして区別。

## 記事

```yaml
---
title: ミニオン名の性能と使い方
description: ページ内容の短い説明
kind: minion
minionId: 固定ID
updated: '2026-09-12'
images: []
relatedMinions: []
---
```

本文は通常のMarkdown。能力表・Lv表は共通データから生成するので本文へ複製しない。一般記事はkind: guideとしminionIdを省略。imagesは共通画像ID、relatedMinionsは既存ミニオンID。一般記事の画像は本文後のギャラリーに表示する最小構成。

サイト内リンクを本文へ追加する場合は、最終ルートに対する相対リンクを使う。GitHub Pagesのリポジトリ名を直書きしない。build後にリンク先・アンカーを検証する。MDXや独自の本文記法は導入していない。

## 参照検証

YAMLスキーマ、星とLvの重複、根拠・用語・画像ID、記事とミニオンの対応、画像の形式とメタデータ、公開物の許可リスト、内部リンクとアンカーを検証する。ゲームの事実として正しいかをスクリプトだけで判定することはできない。

`npm run review` は未確認項目と画像根拠をwork/review.mdへ出力する。ファイル内のプロパティ位置が出るため、後から該当フィールドを補完できる。

## ランブルチェス用の保存データ

data/rumble-chess.yamlは基本性能から分離したランブルチェス情報の正本。詳細ページに絆・星4能力を表示し、検証と確認票にも使用する。

- decks：固定ID、画像確認したデッキ名、所属ミニオン名の配列（members）と根拠。未掲載ミニオンも収録できるよう、サイトのミニオン記事作成を要求しない。memberIdsで確認済みの名前と公開ミニオンIDを結ぶ。所属の正本はdecksのみ。
- decks[].bond：name（絆名のfact）、tiers（段階配列のfact）、tierApplication（段階の適用方式のfact）、mechanics（その他の適用ルールのfact）。tiers.valueの各行にthreshold（画像左列の段階値）、text（効果全文、折り返しと空白のみ整形）、amount（効果量）、unit（points＝攻撃力、percent＝HP割合、coins＝サンコイン個数）を保持する。百分率は4%なら4。根拠はname.sourcesとtiers.sourcesから参照できる。
- 絆効果を表示する場合はloadRumble()からdecks[].members.valueとbond.tiers.valueを同じデッキIDで参照する。原文の「準備完了」「オーラ」や対象条件もtextに保持。段階の効果は累積せず置き換わる（2026-09-22ユーザー確認）。tierApplicationはmanual・replaceとして保存する。例：雲の絆8では攻撃力+2のみ発動し、段階4の+1は加算しない。ポイント集計方法は引き続きmechanicsをunknownで保存する。未掲載段階の補間や段階値の累積計算は行わない。
- observations：任意の詳細画面観測。名前、画像根拠、デッキID、現在Lv、最低保証Lv、選択中の星、絆ポイント、表示性能、撮影条件。
- 星別の3枚/4枚セットは要求しない。撮影した星だけ記録し、未撮影の星を自動生成しない。ランブルチェス画像がないミニオンの項目追加も必須ではない。
- sources台帳のmode・screenは画像を見た分類結果。variantControlは通常詳細でバリアント欄を確認した結果。スクリプトによる画像分類ではない。

デッキの重複ID・所属の重複・詳細と一覧の所属矛盾・根拠ID・モードを検証する。カードプール全体の網羅性を枚数だけで推測しない。

## ランブルチェス詳細表示と利用可否（2026-09-25）

- rules：同じレベルで攻撃力・星1〜3能力が共通であること、最低保証Lv.7、星ごとの絆ポイント1/2/4/8をユーザー確認のmanualで保存する。絆ポイントはミニオンごとに重複登録しない。全体の集計対象など未確認のルールは推定しない。
- memberIds：decks.membersの名前から公開ミニオンIDへの対応。未掲載ミニオンの名前はそのまま保持できる。
- minions：ミニオンIDをキーにavailability（booleanのfact）とstar4を保存。true＝登場、false＝非登場、unknown＝未確認。absentは使用しない。未登録も表示上は未確認。既存一覧は共有デッキを含まないため、名前がないことから非登場と判定しない。
- star4：登場確認済みなら必須。未撮影はunknown。確認済みはability（text・keywords）、currentLevel、guaranteedLevel、conditionsをvalueに持つfact。基本形に対応し、バリアントへ自動適用しない。画像根拠はランブルチェス詳細であることを検証する。現在Lvと保証Lvを分け、能力のレベル依存が不明なら条件を注記する。非登場・登場未確認ではstar4を持たない。
- 基本性能の星1〜3・initialは従来の形式を維持する。ランブルチェス画像で確認した基本性能を登録する場合もレベル条件を維持し、最低保証Lvの値をレアリティ初期値へ転記しない。
- data/minionsの任意項目availability：acquisition（obtainable/unobtainableのfact）とranked（booleanのfact）。未登録から入手可能・使用可能を推測しない。通常入手不可とランクマッチ使用不可を分けて表示する。
- evaluation.rankの対象外は画面上では「-」。ranked=falseの確認と併用し、未評価と区別する。一覧の評価順では末尾、Tier表からは除外する。対象外登録にも評価方針の出典が必要。
- 星4画像は読取根拠として保存し、公開画像には自動追加しない。新たな公開画像を作る場合のみ画像加工・目視・images:publishを行う。

絆の共通アイコンはdecks[].bond.icon（画像IDのfact）で参照する。画像はdata/assets.yamlに登録し、元画像の対応・切り出し座標はwork/recipes.yamlに保持する。絆名と並べて32pxで表示し、画像未登録の場合は名前だけ表示する。
