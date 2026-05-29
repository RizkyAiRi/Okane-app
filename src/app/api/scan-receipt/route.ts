import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'API Key Gemini belum diatur di environment variables (GEMINI_API_KEY)' },
        { status: 500 }
      );
    }

    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Tidak ada gambar yang dikirim' }, { status: 400 });
    }

    // Prepare image for Gemini
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Anda adalah asisten cerdas pengekstrak data struk belanja.
      Ekstrak informasi berikut dari gambar struk ini dan kembalikan hanya dalam format JSON murni (tanpa markdown).
      
      Struktur JSON yang diharapkan:
      {
        "amount": 50000, // Total harga akhir dalam bentuk angka murni
        "description": "Nasi Goreng, Es Teh" // Daftar nama barang utama atau nama toko (maks 50 karakter)
      }
      
      Jika gambar bukan struk atau nominal tidak ditemukan, berikan nilai amount: 0 dan description: "Tidak dapat membaca struk".
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      },
    ]);

    const responseText = result.response.text();
    // Parse the JSON (clean up any potential markdown formatting)
    const jsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const data = JSON.parse(jsonStr);
      return NextResponse.json(data);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      return NextResponse.json(
        { error: 'Gagal mengekstrak data JSON dari gambar', raw: responseText },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('OCR Error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat memproses gambar' },
      { status: 500 }
    );
  }
}
