// ===== 橘 凛 ポートフォリオサイト — バックエンドサーバー =====
// Express + Anthropic SDK で Claude API を呼び出すプロキシサーバー
// 静的ファイル（HTML/CSS/JS）も同時に配信する

require('dotenv').config();
const express   = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const path      = require('path');

const app    = express();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ===== システムプロンプト（ダミー会社情報） =====
// チャットボットがこの情報に基づいて回答する
const SYSTEM_PROMPT = `
あなたは橘 凛（AIエンジニア）のポートフォリオサイトに設置されたチャットアシスタントです。
訪問者からの質問に、丁寧かつ簡潔に日本語で回答してください。
以下の情報に基づいて正確に回答し、不明な点は「詳しくはメールにてご連絡ください」と案内してください。

---

【サービス名】
橘AIデザイン工房 / 橘 凛 AIコンサルティング

【提供サービス】
1. LLMプロダクト開発
   - ChatGPT / Claude / Gemini を活用したWebアプリ・業務ツールの設計・開発
   - RAGシステム構築（社内ドキュメント検索・FAQ自動化など）
   - プロンプトエンジニアリングおよび品質評価

2. MLOps・AIインフラ整備
   - モデルのデプロイ・監視・CI/CDパイプライン構築
   - AWS / GCP / Azure でのAIシステム基盤設計

3. AIコンサルティング
   - AI導入戦略の策定・PoC設計
   - 既存業務へのAI活用ロードマップ作成
   - 社内AI研修・ワークショップの実施

【料金プラン】
- 初回相談: 無料（60分、ZoomまたはGoogle Meet）
- スポット相談: 30,000円 / 時間
- プロジェクト開発: 500,000円〜（規模・要件により見積もり）
- 顧問契約（月次サポート）: 100,000円〜 / 月
- 研修・ワークショップ: 150,000円〜 / 回（最大20名）
※ すべて税別。詳細はお問い合わせください。

【営業時間・連絡先】
- 営業時間: 平日 10:00〜18:00（土日祝休み）
- メールアドレス: rin.tachibana@ai-design-kobo.jp
- 返信目安: 通常1〜2営業日以内
- 所在地: 東京都渋谷区（リモート対応可・全国対応）

【よくある質問（FAQ）】
Q: 相談から契約までどのくらいかかりますか？
A: 初回無料相談後、要件整理（1〜2週間）→ 見積もり提出 → 契約 という流れです。最短で2〜3週間を目安にしています。

Q: 個人・スタートアップでも依頼できますか？
A: はい、もちろんです。小規模PoC（概念実証）や部分的な技術支援など、柔軟に対応しています。

Q: どのプログラミング言語・フレームワークに対応していますか？
A: Python（FastAPI, LangChain, LlamaIndex）、TypeScript（Next.js, Node.js）を主に使用しています。

Q: 秘密保持契約（NDA）の締結は可能ですか？
A: 可能です。ご要望の場合は初回相談時にお知らせください。

Q: 海外クライアントとの仕事は受けていますか？
A: 英語でのコミュニケーションが可能なため、海外クライアントにも対応しています。

---

【会話スタイル】
- 丁寧だが堅すぎない、フレンドリーなトーンで回答する
- 回答は簡潔に（200字以内が目安）
- 料金や契約など重要な情報は正確に伝える
- わからないことは「詳細はメール（rin.tachibana@ai-design-kobo.jp）にてお気軽にどうぞ」と案内する
`.trim();

// ===== ミドルウェア =====
app.use(express.json());

// 静的ファイルをプロジェクトルートから配信（HTML/CSS/JS/画像など）
app.use(express.static(path.join(__dirname)));

// ===== POST /api/chat — Claude API プロキシエンドポイント =====
// フロントエンドから { messages: [{role, content}] } を受け取り、Claudeの返答を返す
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    // 入力バリデーション
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages は配列で送信してください。' });
    }

    // Claude API を呼び出す
    const response = await client.messages.create({
      model:      'claude-haiku-4-5-20251001', // コスト効率の良いモデルを使用
      max_tokens: 512,
      system:     SYSTEM_PROMPT,
      messages:   messages,
    });

    // テキストコンテンツを取り出して返す
    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    res.json({ reply: text });

  } catch (err) {
    console.error('Claude API エラー:', err.message);
    res.status(500).json({ error: 'AIとの通信に失敗しました。しばらくしてからお試しください。' });
  }
});

// ===== サーバー起動 =====
const PORT = process.env.PORT || 3456;
app.listen(PORT, () => {
  console.log(`✅ サーバー起動: http://localhost:${PORT}`);
});
