# meal_at_home_notifier

GASとAppleのショートカットで予定を自動取得してGoogle Calenderにその日のご飯を家で食べるか(ご飯の時間に外の予定が入っているか)を書き込みます。

毎日「今日は家でご飯を食べるか」を家族に伝えるのが面倒でお互いが困っていたため開発しました。このプロジェクトは、カレンダーの予定をもとにそれを自動で判定して、Googleカレンダーに `【食事】昼：◯ / 夜：✕` のような形でまとめて反映してくれる、Apple Shortcuts と Google Apps Script (GAS) の小さな連携システムです。

---

## 🇯🇵 日本語

### 仕組み

1. Shortcuts が今日から7日分の日付をループ処理し、各日についてカレンダーの予定を検索します（Birthdaysカレンダーは除外）。
2. 各日について、以下の2つの時間帯にそれぞれ予定が入っているかを確認します:
   - **昼: 10:55〜12:05** の間に予定があれば「外食予定あり＝家では昼食不要」
   - **夜: 18:55〜20:05** の間に予定があれば「外食予定あり＝家では夕食不要」
   - この時間帯に予定が入っていなければ「家で食事あり」と判定します。
3. `date` / `lunch` / `dinner` を持つDictionaryをリストにまとめ、認証トークンとともにJSONとしてGASのWebアプリにPOSTします。
4. GAS側はトークンを検証した上で、対象期間の既存の `【食事】` イベントを削除し、新しい判定結果でイベントを作り直します。

### セットアップ

**1. Google カレンダー**

食事の予定を記録する用のカレンダーを1つ用意し、そのカレンダーIDを控えておいてください。

**2. Google Apps Script**

1. `gas/main.gs` の内容を新しい Apps Script プロジェクトに貼り付けます。
2. 「プロジェクトの設定」→「スクリプト プロパティ」に以下を追加してください:
   - `MEAL_CALENDAR_ID`: 上で控えたカレンダーID
   - `API_TOKEN`: 任意のランダムな文字列（`openssl rand -hex 16` などで生成すると簡単です）
3. Webアプリとしてデプロイし（アクセスできるユーザー: 全員 / 実行するユーザー: 自分）、発行されたURLを控えます。

**3. Apple Shortcuts**

1. [こちらの iCloud リンク](https://www.icloud.com/shortcuts/e446488ad97844a185d781934db77fb7)からショートカットをインストールします。
2. 「Get contents of URL」アクションのURL欄に、先ほど発行したGASのWebアプリURLを入力します。
3. JSONを組み立てている「Text」アクション内の `"token"` の値に、`API_TOKEN` と同じ文字列を入力します。

**4. 自動で走らせたい場合（おすすめです）**

毎回手動で実行するのは面倒なので、Shortcuts アプリの「オートメーション」タブから、このショートカットを**毎週決まった曜日・時間に自動実行**するよう設定しておくと、あとは何もしなくても1週間分のご飯予定がカレンダーに反映され続けます。「時刻」を選ぶタイプのオートメーションを作り、繰り返しを「毎週」にして曜日を指定するだけでOKです。実行前の確認を省きたい場合は、「実行前に尋ねる」をオフにしておくとスムーズに動きます。

### セキュリティに関する注意

- GASのWebアプリURLとトークンは、絶対に他の人と共有したり公開したりしないでください。どちらも知られてしまうと、第三者があなたのカレンダーを書き換えられてしまいます。
- 本リポジトリのショートカットには、URL・トークンともに空欄のプレースホルダーが入っています。必ずご自身の値に置き換えてから使ってください。
- カレンダーの予定タイトルや詳細が送信されることは一切ありません。やり取りされるのは日付と真偽値（予定があるかどうか）だけなので、その点は安心して使っていただけます。

---

## 🇬🇧 English

Figuring out (and telling everyone) whether you'll be eating at home each day is a small but annoying chore — this project was born out of both of us getting tired of that daily back-and-forth. It reads your calendar, works out whether you'll be home for lunch/dinner, and writes the result back into a Google Calendar as a friendly all-day event like `【食事】昼：◯ / 夜：✕`. It's a small Apple Shortcuts + Google Apps Script (GAS) duo.

### How it works

1. The Shortcut loops through the next 7 days, checking your calendar for events on each date (excluding the Birthdays calendar).
2. For each day, it checks two specific time windows for any events:
   - **Lunch: 10:55–12:05** — an event in this window means "eating out, no lunch needed at home."
   - **Dinner: 18:55–20:05** — an event in this window means "eating out, no dinner needed at home."
   - No event in a given window means "meal needed at home" for that slot.
3. The results are gathered into a list of `{date, lunch, dinner}` dictionaries and POSTed as JSON, along with an auth token, to your GAS web app.
4. GAS checks the token, clears out any existing `【食事】` events in that date range, and recreates them with the fresh results.

### Setup

**1. Google Calendar**

Create (or pick) a calendar to hold the meal events, and jot down its Calendar ID.

**2. Google Apps Script**

1. Paste the contents of `gas/main.gs` into a new Apps Script project.
2. Under **Project Settings → Script Properties**, add:
   - `MEAL_CALENDAR_ID`: the calendar ID from step 1
   - `API_TOKEN`: a random secret string (generating one with `openssl rand -hex 16` works nicely)
3. Deploy it as a **Web App** (Execute as: Me / Who has access: Anyone), and note the deployment URL.

**3. Apple Shortcuts**

1. Install the Shortcut from [this iCloud link](https://www.icloud.com/shortcuts/e446488ad97844a185d781934db77fb7).
2. In the **Get contents of URL** action, set the URL to the GAS web app URL from step 2.
3. In the **Text** action that builds the JSON body, set the `"token"` value to match your `API_TOKEN`.

**4. Let it run on its own (recommended)**

Running this by hand every time gets old fast, so it's worth setting up a **weekly automation** in the Shortcuts app: open the Automation tab, create a time-based automation, set it to repeat weekly on the day and time you like, and point it at this Shortcut. If you'd rather it just run quietly in the background, turn off "Ask Before Running" so it doesn't wait for confirmation each time.

### Security notes

- Please never share or publish your GAS web app URL or API token — anyone who has both could rewrite your calendar.
- The Shortcut in this repo ships with the URL and token fields left blank on purpose. Just swap in your own values before using it.
- Rest easy: no event titles or details are ever sent. Only the date and a simple true/false (whether the day has any event) travel over the wire.

---

## License

MIT
