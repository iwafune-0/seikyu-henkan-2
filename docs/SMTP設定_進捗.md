# カスタムSMTP設定 進捗記録

**作成日**: 2026-01-05
**ステータス**: 対応中（ドメイン認証待ち）

---

## 1. 背景

### 問題
- Supabaseの無料SMTPはレート制限あり（2通/時間）
- 開発テスト中のバウンスメールにより、さらに制限された
- Supabaseサポートに解除を依頼したが、**解除不可**との回答

### Supabaseサポートからの回答（2025-12-24）

> Unfortunately, we have capped the rate limit on the free SMTP service Supabase provides as we are facing risk of nobody being able to sign up. This change is to protect our email domain from being abused.
>
> As mentioned in our Production Readiness guide, Supabase's email service is designed for initial development purposes and is not intended for production use.
>
> To ensure uninterrupted service and prevent any disruptions, we kindly request that you take the following actions:
> 1. Setup a custom SMTP provider
> 2. And, setup CAPTCHA protection

**結論**: カスタムSMTPを設定しない限り、レート制限は解除されない

---

## 2. 現在のSupabase SMTP設定

| 項目 | 値 | 備考 |
|------|-----|------|
| Enable custom SMTP | ON | 有効化済み |
| Sender email | onboarding@resend.dev | Resendのテスト用アドレス |
| Sender name | 月次処理システム | - |
| Host | smtp.resend.com | Resend |
| Port number | 2465 | **要修正 → 465** |
| Username | resend | - |
| Password | ●●●●●● | 設定済み |

---

## 3. 問題点と修正事項

### 3.1 ポート番号の修正

| 現在 | 修正後 |
|------|--------|
| 2465 | **465**（SSL/TLS） |

Resendの正しいポート：
- 465（SSL/TLS）← 推奨
- 587（STARTTLS）

### 3.2 送信元アドレスの問題

| 現在 | 問題 | 修正後 |
|------|------|--------|
| onboarding@resend.dev | 自分宛てにしか送れない | **noreply@terracom.co.jp** |

`onboarding@resend.dev` はResendのテスト用アドレスで、他のユーザーには送れない。

---

## 4. terracom.co.jp ドメイン認証

### 4.1 なぜ必要か

```
terracom.co.jp からメールを送りたい
    ↓
「本当にterracom.co.jpの所有者か？」を証明する必要がある
    ↓
DNS設定にResendが指定するレコードを追加
    ↓
Resendが確認 → ドメイン認証完了
    ↓
noreply@terracom.co.jp から送信可能に
```

### 4.2 ドメイン管理者への依頼が必要

**依頼先**: terracom.co.jp のドメイン管理者（IT担当）

**依頼内容**: DNS設定に以下のレコードを追加
- TXTレコード（SPF認証）
- CNAMEレコード（DKIM認証）

### 4.3 DNSレコードの取得方法

1. [Resendダッシュボード](https://resend.com/domains) にログイン
2. **Domains** → **Add Domain**
3. `terracom.co.jp` を入力
4. **追加すべきDNSレコードが表示される**
5. ドメイン管理者に依頼

### 4.4 依頼メールのテンプレート

```
件名: DNS設定追加のお願い（メール送信用）

お疲れ様です。

月次処理自動化システムで招待メールを送信するため、
terracom.co.jpのDNS設定に以下のレコードを追加していただけますでしょうか。

【追加するレコード】
※Resendダッシュボードで取得した値を記載

種類: TXT
ホスト: （Resendから取得）
値: （Resendから取得）

種類: CNAME
ホスト: （Resendから取得）
値: （Resendから取得）

よろしくお願いいたします。
```

---

## 5. 設定完了後の手順

### Step 1: ポート番号修正
- Supabase Dashboard → Settings → Authentication → SMTP Settings
- Port number: 2465 → **465** に変更
- Save changes

### Step 2: ドメイン認証（ドメイン管理者の対応後）
- Resendダッシュボードでドメイン認証完了を確認

### Step 3: 送信元アドレス変更
- Supabase Dashboard → SMTP Settings
- Sender email: `noreply@terracom.co.jp` に変更
- Save changes

### Step 4: テスト送信
- ユーザー管理ページから招待メールを送信
- 正常に届くことを確認

---

## 6. Resendの無料枠

| 項目 | 制限 |
|------|------|
| 月間送信数 | 3,000通 |
| 日間送信数 | 100通 |

社内利用（数人）であれば十分な枠。

---

## 7. 代替案（ドメイン認証が難しい場合）

| 方法 | 内容 | デメリット |
|------|------|-----------|
| Supabase Pro | 月$25でレート制限緩和 | 費用がかかる |
| 手動でユーザー作成 | Supabaseダッシュボードから直接作成 | 招待メール機能が使えない |

---

## 8. サブドメインについて

### サブドメインとは

```
terracom.co.jp          ← メインドメイン
updates.terracom.co.jp  ← サブドメイン（自由に作れる）
```

### なぜサブドメインを使うか

| 方式 | 既存DNS | リスク |
|------|---------|--------|
| **サブドメイン** | 触らない | **なし** ✅ |
| メインドメイン | 編集が必要 | 設定ミスで既存メールに影響 |

**既存の @terracom.co.jp メールには影響しない**（サブドメインは別扱い）

### よく使われるサブドメイン名

| 名前 | 送信元アドレス例 |
|------|-----------------|
| `system` | noreply@system.terracom.co.jp |
| `mail` | noreply@mail.terracom.co.jp |
| `notifications` | noreply@notifications.terracom.co.jp |

---

## 9. 費用について

| 項目 | 費用 |
|------|------|
| ドメイン維持費（terracom.co.jp） | 既に払っているはず（年額） |
| **DNS設定の追加**（TXT、CNAMEレコード） | **無料** |
| Resend | 無料（3,000通/月まで） |

---

## 10. ドメイン管理者への依頼内容

### 依頼メール/チャットの例

```
件名: メール送信用サブドメインのDNS設定のお願い

お疲れ様です。

月次処理自動化システムで招待メールを送信するため、
サブドメインのDNS設定をお願いしたいです。

【確認事項】
1. サブドメイン名は何が良いでしょうか？
   例: system.terracom.co.jp、mail.terracom.co.jp など
   ※既存ルールや推奨があれば教えてください

2. サブドメイン名が決まり次第、DNS設定（TXT、CNAMEレコード）の
   追加をお願いできますか？
   ※具体的な設定値は後ほど共有します

【補足】
・既存の @terracom.co.jp メールには影響しません
  （サブドメインは別扱いのため）
・費用はかかりません（DNSレコード追加のみ）

よろしくお願いいたします。
```

---

## 11. 作業手順

### 今すぐやること

| # | やること |
|---|---------|
| 1 | 上記の依頼をドメイン管理者に送る |

### 管理者から回答が来たら

| # | やること |
|---|---------|
| 2 | Resendでサブドメインを追加（決まった名前で） |
| 3 | 表示されるDNSレコードをコピー |
| 4 | 管理者にDNSレコードの追加を依頼 |

### DNS設定完了後

| # | やること |
|---|---------|
| 5 | Resendでドメイン認証完了を確認 |
| 6 | SupabaseのSMTP設定を更新（ポート番号465、送信元アドレス変更） |
| 7 | テスト送信で動作確認 |
| 8 | E2Eテスト残り2項目の再実行 |

### 待ち時間の目安

| ステップ | 時間 |
|---------|------|
| 管理者からの回答 | 1-2日（相手次第） |
| DNS設定の反映 | 数分〜最大48時間 |

---

## 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2026-01-05 | 初版作成（現状整理、対応手順まとめ） |
| 2026-01-05 | サブドメイン説明、費用、管理者への依頼内容、作業手順を追加 |
