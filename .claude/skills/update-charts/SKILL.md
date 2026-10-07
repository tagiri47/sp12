---
name: update-charts
description: data フォルダに置いた新しい譜面 JSON を data/charts.json に反映し、CHANGELOG 追記・ビルド・commit・push まで行う
disable-model-invocation: true
---

# 譜面データ更新

以下の手順を順番に実行する。途中で失敗したら、そこで止めて状況を報告する。

## 1. JSON ファイルの置き換え

`data/` 内の `charts.json` 以外の `.json` ファイルを探す。

- 1 個だけある場合: そのファイルで `data/charts.json` を上書きする（`mv` で移動し、元ファイルは残さない）。
- 見つからない場合: `data/charts.json` が直接上書き済みとみなし、そのまま次へ進む。
- 2 個以上ある場合: どれを使うかユーザーに確認する。

## 2. CHANGELOG.md への追記

`node scripts/diff-charts.js` を実行し、HEAD との差分を確認する。キー順の違いは無視されるため、`git diff` ではなくこちらを使う。

- `変更なし` と出た場合: CHANGELOG・ビルド・commit は行わず、その旨を報告して終了する。
- 変更がある場合: `CHANGELOG.md` の末尾に、今日の日付で 1 行追記する。既存行の書式に合わせること。

```
- YYYY/MM/DD: 譜面データにN譜面を追加（曲名 ANOTHER: ノマゲ地力C / ハード地力B+、曲名 ANOTHER: ノマゲ地力A / ハード地力A）
```

- 追加以外の変更（難易度変更・曲名修正・削除など）も、同じ行に「、」でつないで書く（例: `、Life Is A Game ft.DD"ナカタ"Metal の曲名表記を修正`）。
- 同じ日付の行がすでにある場合は、新しい行を作らずにその行へ内容をまとめる。
- 改行コードは LF のまま保つ。

## 3. ビルド

`node scripts/build.js` を実行し、次の 2 点を確認する。

- 出力された譜面数が想定どおりか
- `index.html` の `changelog-data` に今日の日付のエントリが含まれているか（`grep -o '"changelog-data"[^<]*' index.html | head -c 300` など）

## 4. add / commit / push

- `git add CHANGELOG.md data/charts.json index.html`（手順 1 で移動した元ファイルが追跡されていた場合は、その削除も含める）
- コミットメッセージは英語で、内容がわかるように書く（例: `Add Smintheus chart and update changelog`）。
- 現在のブランチを push する。upstream が未設定なら `git push -u origin <branch>` を使う。
- 現在のブランチが `main` の場合は、push する前にユーザーに確認する。

最後に、追記した CHANGELOG の行・コミットハッシュ・push 先を報告する。
