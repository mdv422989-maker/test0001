import { NextRequest, NextResponse } from "next/server";

interface VisionApiResponse {
  responses: Array<{
    textAnnotations?: Array<{
      description: string;
      locale?: string;
    }>;
    error?: {
      message: string;
    };
  }>;
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "リクエストの形式が不正です" },
        { status: 400 }
      );
    }

    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: "画像データが必要です" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OCR機能を利用するにはGoogle Cloud Vision APIキーの設定が必要です。Vercelの環境変数にGOOGLE_CLOUD_VISION_API_KEYを設定してください。",
        },
        { status: 500 }
      );
    }

    // Call Google Cloud Vision API
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: image },
              features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
            },
          ],
        }),
      }
    );

    if (!visionResponse.ok) {
      const errorData = await visionResponse.json().catch(() => null);
      const errorMsg =
        errorData?.error?.message || `Vision APIエラー (${visionResponse.status})`;
      console.error("Vision API Error:", errorMsg);
      return NextResponse.json(
        { error: `レシート読み取りエラー: ${errorMsg}` },
        { status: 500 }
      );
    }

    const visionData: VisionApiResponse = await visionResponse.json();

    if (visionData.responses[0]?.error) {
      return NextResponse.json(
        { error: `Vision APIエラー: ${visionData.responses[0].error.message}` },
        { status: 500 }
      );
    }

    const fullText =
      visionData.responses[0]?.textAnnotations?.[0]?.description || "";

    if (!fullText) {
      return NextResponse.json(
        { error: "レシートからテキストを検出できませんでした。画像が鮮明か確認してください。" },
        { status: 400 }
      );
    }

    // Parse receipt text
    const parsed = parseReceiptText(fullText);

    if (parsed.items.length === 0) {
      return NextResponse.json(
        { error: "レシートから商品情報を読み取れませんでした。手動で入力してください。" },
        { status: 400 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("OCR Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "レシートの読み取りに失敗しました",
      },
      { status: 500 }
    );
  }
}

function parseReceiptText(text: string): {
  store: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  date: string;
} {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Extract store name (usually the first non-empty line)
  const store = lines[0] || "";

  // Extract date
  let date = new Date().toISOString().split("T")[0];
  for (const line of lines) {
    // Match various Japanese date formats
    const dateMatch = line.match(
      /(\d{4})[年\/\-.](\d{1,2})[月\/\-.](\d{1,2})/
    );
    if (dateMatch) {
      const [, y, m, d] = dateMatch;
      date = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      break;
    }
    // Match short year format
    const shortDateMatch = line.match(
      /(\d{2})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/
    );
    if (shortDateMatch) {
      const [, y, m, d] = shortDateMatch;
      const fullYear = parseInt(y) > 50 ? `19${y}` : `20${y}`;
      date = `${fullYear}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      break;
    }
  }

  // Extract items and prices
  const items: Array<{ name: string; price: number; quantity: number }> = [];
  const pricePattern = /[¥￥]?\s*(\d{1,3}(?:,\d{3})*|\d+)\s*$/;
  const excludePatterns = [
    /合計/,
    /小計/,
    /税/,
    /消費/,
    /お預/,
    /お釣/,
    /クレジット/,
    /現金/,
    /ポイント/,
    /電話/,
    /TEL/i,
    /レジ/,
    /担当/,
    /No\./i,
  ];

  for (const line of lines) {
    // Skip lines that match exclude patterns
    if (excludePatterns.some((p) => p.test(line))) continue;

    const match = line.match(pricePattern);
    if (match) {
      const price = parseInt(match[1].replace(/,/g, ""));
      if (price > 0 && price < 1000000) {
        const name = line
          .replace(pricePattern, "")
          .replace(/[¥￥]/g, "")
          .replace(/\s+/g, " ")
          .trim();
        if (name && name.length > 0 && name.length < 50) {
          items.push({ name, price, quantity: 1 });
        }
      }
    }
  }

  return { store, items, date };
}
