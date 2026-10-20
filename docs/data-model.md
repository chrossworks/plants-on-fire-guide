# データ形式

## 正本

- ミニオン：`data/minions/<id>.yaml`
- 攻略文：`content/<id>.md`
- 用語：`data/keywords.yaml`
- 隊長バッジ：`data/captain-badges/<id>.yaml`（ページ構成から独立）
- 検証スキーマ：`lib/schema.mjs`

YAMLとMarkdownは手で追加・修正できる。buildは読み取りのみ。AIや元画像が利用できなくても公開サイトを再生成できる。

## 隊長バッジの先行収録

`lib/captain-badges.mjs`で読み込み・形式検証する。記事は必須にせず、一覧・個別ページは後日検討する。現在はページを生成しない。

- name / rarity / observedLevel / effect / acquisition：名前、レア度、撮影Lv、そのLvの効果、入手方法。それぞれfactとし根拠を保存する。ミニオンのレア度別最低Lv規則は適用しない。
- progression：maxLevel、costs、coverage（読み取った強化Lv範囲）、levels（到達Lvと表示効果の原文）。Lv.3/5のチャーム解放・強化をバッジ本体の効果と混同しない。最大Lv.5はユーザー確認。費用は将来収録予定で、当面unknownを許容する。
- icons：rarityBackground（四角いレア度背景付き）、plain（星形のバッジ本体）。plainは透過を意味せず、画面の地色を含む。
- charms：固定ID、名前、レア度、効果、丸いicon、upgradedEffect。背景色からチャームのレア度を確定せず、強化後の名前・効果は未撮影ならunknown。星や鍵の付いたカード欄はアイコンに使わない。
- evaluation：未評価はunknown。将来の攻略評価・使い方をバッジ単位で保存できる。長文が必要になった時点で記事との対応を決める。

`progression.currency`は画像で確認できた育成通貨を任意で保存する。通貨だけ判明しても必要数量を補完せず、`costs`はunknownのまま保持する。バッジとチャームの効果は個別に読み取り、同じ値とは仮定しない（ミニレックスはバッジLv.1が+1、チャームⅠが+2）。

根拠と未確認は`npm run review`に含まれる。+7%の表示はユーザー指定により今回の収録対象外。原本・分類台帳には画像を保持する。画像加工は既存の`images`→目視→`images:publish`を使い、公開ページの追加は伴わない。

## ランブルバッジの先行収録

`data/rumble-badges/<id>.yaml`を正本とし、`lib/rumble-badges.mjs`で検証する。隊長バッジとは別に保存し、記事・ページは生成しない。

- name / effect：画像で確認した名前と効果全文のfact。折り返し・空白を整えるが、発動タイミング・対象・一時効果などの条件は保持する。
- category：`rumble`（ランブルバッジ）または`rumble-gold-pass`（ランブルゴールドパスバッジ）。青背景／赤背景との対応は2026-09-28ユーザー確認のmanualとして根拠を付ける。
- background：画像で確認した`blue`または`red`。レアリティとして扱わない。
- icon：画像IDのfact。青／赤のバッジ背景を含む正方形で切り出し、画面の地色を含むWebPとして保存する。透過画像ではない。
- acquisition / evaluation：未収録はunknown。画像にないLvや育成・入手条件を隊長バッジから流用しない。

現在の収録はランブルバッジ（青背景）35種類、ランブルゴールドパスバッジ（赤背景）21種類。撮影分の収録であり、全種類の網羅性は未確認。画像根拠はmode: rumble-chess、screen: badge-detailとし、検証・確認票にも含める。アイコンの確認とローカル反映は従来のimages→目視→images:publishで行う。

## 運命のギフトの先行収録

`data/fate-gifts/<id>.yaml`を正本とし、`lib/fate-gifts.mjs`で検証する。記事・ページは生成しない。IDにはラウンドを含め、同名でもラウンドが異なる効果を別に保存できる。

- name / effect：画像で確認した名前と効果全文のfact。対象・期間・一時効果・購入／配置効果の不発動・売却不可などの条件を保持する。
- round：4 / 7 / 10のfact。初回は2026-09-28ユーザー確認によりmanualとして登録。2026-10-12追加の一覧画像で見出し・名前・図柄を照合できた項目は、監査時に画像根拠を付けてobservedへ更新する。見出しのない続きは重複するカードとラウンド境界を含む複数画像で所属を確認する。確認できなければ保留し、未監査分を一括変更しない。過去のユーザー確認は監査履歴に保存する。同名でも別ラウンドの効果量を流用しない。
- unlock：解放条件のfact。表示ありはobserved、表示なしはユーザー指定に従い画像根拠と確認記録を付けてabsent（解放条件なし）。今後、条件欄を確認できない画像はunknownとする。
- icon：公開画像IDのfact。詳細画面上部の図柄を枠ごと正方形で切り出す。画面の地色を含むWebPであり透過画像ではない。

現在の収録はラウンド4の20種類（トロフィー1400で解放が10種類、解放条件なしが10種類）、ラウンド7の20種類（トロフィー400が10種類、1600が10種類）、ラウンド10の14種類（トロフィー550が7種類、1800が7種類）の計54種類。全種類の網羅性は未確認。画像根拠のscreenは詳細がfate-gift-detail、一覧がfate-gift-list。検証・確認票の対象とし、原本パスと加工レシピはwork内だけに保持する。

「一か八か」の効果文にある「現在：0」は撮影時の表示値として原文に残し、effect.noteで条件を保持する。獲得量の固定値や未確認値の代用として扱わない。

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

登録時の初回読取・再読・領域座標・原本ハッシュ・照合結果は非公開の `work/registration/` に保持する。公開データのstatusとは別管理とし、observedだけで再読確認済みとは扱わない。[読取確認手順](reading-review.md) を参照。通常buildはこの非公開記録を必要としない。

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
- memberIds：decks.membersの名前から固定ミニオンIDへの対応。未掲載ミニオンも所属一覧の名前とIDを結んで星4データを先行登録できる。公開データが存在する場合は名前・IDの一致を検証する。
- minions：ミニオンIDをキーにavailability（booleanのfact）とstar4を保存。true＝登場、false＝非登場、unknown＝未確認。absentは使用しない。未登録も表示上は未確認。既存一覧は共有デッキを含まないため、名前がないことから非登場と判定しない。
- star4：登場確認済みなら必須。未撮影はunknown。確認済みはability（text・keywords）、currentLevel、guaranteedLevel、conditionsをvalueに持つfact。基本形に対応し、バリアントへ自動適用しない。画像根拠はランブルチェス詳細であることを検証する。現在Lvと保証Lvを分け、能力のレベル依存が不明なら条件を注記する。非登場・登場未確認ではstar4を持たない。
- 基本性能の星1〜3・initialは従来の形式を維持する。ランブルチェス画像で確認した基本性能を登録する場合もレベル条件を維持し、最低保証Lvの値をレアリティ初期値へ転記しない。
- data/minionsの任意項目availability：acquisition（obtainable/unobtainableのfact）とranked（booleanのfact）。未登録から入手可能・使用可能を推測しない。通常入手不可とランクマッチ使用不可を分けて表示する。
- evaluation.rankの対象外は画面上では「-」。ranked=falseの確認と併用し、未評価と区別する。一覧の評価順では末尾、Tier表からは除外する。対象外登録にも評価方針の出典が必要。
- 星4画像は読取根拠として保存し、公開画像には自動追加しない。新たな公開画像を作る場合のみ画像加工・目視・images:publishを行う。

絆の共通アイコンはdecks[].bond.icon（画像IDのfact）で参照する。画像はdata/assets.yamlに登録し、元画像の対応・切り出し座標はwork/recipes.yamlに保持する。絆名と並べて32pxで表示し、画像未登録の場合は名前だけ表示する。

## 実装日・アップデート・旧性能（2026-10-15）

- `introduced`：実装日のfact。ミニオン本体、各バリアント、隊長、各種バッジ・チャーム・運命のギフトに使用できる。observed/manual/unknownのみ。年月日は実在するISO日付。撮影日・記事updatedとは別。既存ミニオン73体はユーザー指定により2026-08-27、既存バリアントはunknown。実装日から当時の性能を推定しない。
- `data/updates/<id>.yaml`：アップデート台帳。固定IDとdate、title、changesを持つ。changesは対象kind/id/minionId/formId/name、種類、announcement（告知内容のfact）、details（実機確認の内容またはunknown）。追加にはintroducedを持たせる。告知の数値を実機のinitial/starsへ自動転記しない。
- 新ミニオン・新バリアントは台帳に先行登録できる。性能・画像のないミニオン詳細ページを無理に生成せず、一覧や既存ミニオンのバリアント欄に実装日と確認中を表示する。詳細を後日登録したら同じIDで結び、正本側のintroducedと台帳の日付の一致を検証する。新バリアントの追加告知がある場合、以前のvariants.absentを現在の「なし」と表示しない。
- `data/captains/<id>.yaml`：隊長本体。隊長バッジと別。name/introduced/effectをfactで保存。今回は海賊隊長の実装日と実機効果をunknownで先行登録。
- `data/history/<id>.yaml`：旧登録内容の保存。updateId/changeIdで変更台帳と結ぶ。kind=minionはminionId/formIdとsnapshot（変更前のミニオン正本全体）、kind=rumble-poolはsnapshot（ランブルチェス正本全体）。保存日capturedは適用日ではない。periodに確認できる適用期間またはunknownと理由を記録。根拠・条件・未確認をそのまま保存する。既存履歴を上書きせず、変更ごとに別IDを追加する。
- `base.pendingUpdate` / `variants.items[].pendingUpdate`：変更後の詳細が未確認の場合に設定。主表は確認中とし、保存済み旧性能は折りたたみで表示。最新の実機性能を登録・照合した後に解除する。旧数値は移行待ちの登録内容として残るが、最新性能として表示しない。
- 初回の旧性能保存は画像の再監査ではない。確認記録のmethod=preservationで保存元ファイル・非公開バックアップ・SHA256・元内容を記録し、通常の監査合格数とは別に集計する。buildは非公開バックアップ不要。登録check/acceptは保存元ハッシュと内容の一致を要求する。

公開表示は `/updates/` と `/updates/<id>/`。個別ページの旧性能と相互リンクする。履歴は新しいアップデート順、同日の複数アップデートは別IDで保存可能。ランブルチェスの変更詳細がunknownの間は旧登場状態・絆・星4表示を折りたたみ、最新扱いにしない。サイトの誤記訂正はゲーム内の能力変更として登録しない。

隊長の旧性能もhistoryのkind=captain、captainId、snapshot（隊長正本）で保存できる。海賊隊長は旧実機データ自体が未収録のため、今回は告知にある発動タイミングの変更前後だけを保存し、過去の能力全文を作らない。
評価はevaluation.pendingUpdateで性能のpendingUpdateと分離する。実機性能の更新だけでは調整後の攻略評価を確認済みにしない。評価・使い方を確認したときに独立して解除する。

隊長関連のバッジ・チャームは隊長本体へ転記せず、`data/captain-badges`に保持する。`progression.observedLevel`は育成画面の現在Lvで、詳細の`observedLevel`と区別する。旧バッジ正本全体はhistoryの`kind: captain-badge`、`badgeId`、`snapshot`で保存し、対応する隊長の変更IDに結ぶ。同じ変更に隊長本体とバッジの履歴をそれぞれ保存できるが、同じ種類の履歴は重複禁止。更新ページには現行バッジ・育成・チャームの性能と折りたたみの旧性能を表示する。海賊隊長の9/29調整はバッジ/チャームの実機確認済みで、隊長本体の詳細・実装日は引き続き未確認。

### 形態を含むカードプールの更新

`data/rumble-chess.yaml` の `updateId` は対応するアップデート台帳を参照する。`memberIds` は表示名からカード枠の固定IDへの対応。基本形はミニオンID、バリアントは `<minionId>-<formId>` を用い、`memberForms[cardId] = { minionId, formId }` を必ず登録する。基本形の登場状態・星4をバリアントへ引き継がない。旧形式の履歴には `memberForms` がなく、すべて基本形として読む。

各デッキの `cards` は名前・カードプール上のコスト・表示Lvを根拠付きで保存する。通常性能や初期Lv・育成Lvと混同しない。共有デッキは `sharedDeck` に確認状態を保持し、6デッキにいないことだけで非登場にしない。詳細未撮影の新規専用ミニオンは、カードID・所属・`exclusive`・`introduced` と未確認の星4まで先行登録できる。通常ミニオンページの作成や能力の補完は行わない。

プール改訂前の正本は `data/history` の `rumble-pool` スナップショットに全体保存する。今回の一覧から確認できない旧詳細観測・星4は履歴で参照できるようにし、現行の未確認値へ移す。絆効果の変更がない場合は既存の効果・根拠を保持する。個別ページは形態ごとの現行所属と折りたたんだ旧所属・星4、更新ページは現行6デッキと旧6デッキを表示する。

### ランブルチェス専用ミニオンの詳細登録

ランブルチェス専用でも `data/minions` と `content` にページ用データを保持する。星1〜3は撮影条件付きの `base`、星4・絆ポイントは `rumble-chess` へ分離する。`initial` は撮影値で補完せず、換算を確認できない場合はunknown。専用区分は `rumble-chess.minions[id].exclusive`、ランクマッチ対象外は `availability.ranked` と評価に保持する。ランブルチェスの観測値でも、攻撃対象が「攻撃不可」と確認された場合のみ攻撃間隔0を許す。バリアントの非表示だけではabsentにしない。

## 形態別ページ・記事・評価

基本形のURLは従来の `/minions/<id>/`、バリアントは `/minions/<id>/<formId>/`。データの正本は同じミニオンYAML内のbaseとvariants.itemsに維持し、ページ分割のために性能を複製しない。本文の自動リンクはバリアントの正式名を優先し、個別ページへ向ける。旧 `#variant-1` 等のアンカーは基本形ページの形態一覧に残し、個別ページへのリンクを表示する。

記事ヘッダーに `formId`（省略時base）と `mode`（standard / rumble-chess / both）を追加。ミニオン記事は minionId + formId で一意に対応付け、未知の形態・重複を検証する。基本形記事は従来どおり必須、バリアント記事は任意。未執筆の本文を基本形から複製しない。元メモの記入例はworkflow.mdを参照。

各形態の任意の `evaluations` にモードごとの評価を保存する。

```yaml
evaluations:
  standard:
    rank: 未評価
  rumble-chess:
    rank: 未確認
    reason: 調整後の評価は未確認。
```

rankはSS / S / A / B / C / 未評価 / 未確認 / 対象外。点数と対象外には根拠IDのsourceが必要、未確認にはreasonが必要。調整前の評価にはpendingUpdateを指定する。省略したモードは未評価として表示し、他形態・他モード・旧evaluationから補わない。旧ルート直下のevaluationは任意の保管用フィールドとし、既存データや履歴は変更せず残す。

利用可否と評価は別管理。基本形は従来のavailability.ranked、各形態で明記する場合はその形態のavailability.rankedを使う。バリアントへ基本形の使用可否を引き継がない。ランブルチェスは形態対応を持つrumble-chessの登場状態を使い、未収録を非登場にしない。使用不可・非登場と確認済みの形態・モードに点数は設定できない。

## バリアントの一覧用アイコン

各 `variants.items[].icon` は公開画像ID。基本形の `icon` と個別に登録し、未登録のバリアントへ基本形アイコンを自動流用しない。`image`（詳細ページのカード・立ち絵）とは役割が異なる。

一覧用アイコンは、確認済み基本形アイコンに実機から切り出した数字と枠を合成できる。Sは銀、SSは金。現在の素材は銀Ⅰ・銀Ⅱ・金Ⅰ・金Ⅱ・金Ⅲ。番号は形態ID・正式名、色は既存の `cardRank` と照合し、未確認の番号・ランクを推測で補わない。合成元の一覧用アイコンがなければ保留する。銀ⅡはポップガンナーⅡの既存原本で確認。

`work/recipes.yaml` の通常レシピに任意の `overlay` を指定する。`overlay.source`・`expectedSize`・`crop`・`masks` はマーク原本の情報で、`width` は出力マーク幅、`left`・`top` は合成先アイコン上の座標。`composition` に基本形画像ID・形態ID・カードランクを記録する。原本パスはworkだけに保持する。マスクは従来どおり原本座標の不透明黒。合成後は160px正方形のWebPとして保存する。

生成は `npm run images -- --only=<画像ID>`。複数IDはカンマ区切りにでき、`images:publish` も同じ指定に対応する。原本・切り出し・合成位置・基本アイコンのレシピを変更したら、関連する合成レシピの `reviewed` をfalseに戻す。加工画像を目視してからtrueにし、`images:publish` でローカル反映する。画像台帳・形態別の登録値・確認記録を揃え、review・test・build・表示確認後にregistration:acceptする。
