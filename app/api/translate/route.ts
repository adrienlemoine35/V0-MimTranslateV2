import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { texts, sourceLang = "EN", targetLang = "FR" } = await request.json()

    const apiKey = process.env.DEEPL_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { 
          error: "DEEPL_API_KEY non configurée", 
          message: "Veuillez configurer la variable d'environnement DEEPL_API_KEY" 
        },
        { status: 500 }
      )
    }

    // Determine if using free or pro API based on key suffix
    const isFreeApi = apiKey.endsWith(":fx")
    const baseUrl = isFreeApi 
      ? "https://api-free.deepl.com/v2/translate" 
      : "https://api.deepl.com/v2/translate"

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Authorization": `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: texts,
        source_lang: sourceLang,
        target_lang: targetLang,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] DeepL API error:", response.status, errorText)
      return NextResponse.json(
        { 
          error: `Erreur API DeepL: ${response.status}`, 
          details: errorText 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("[v0] DeepL API success:", data)

    return NextResponse.json({
      translations: data.translations.map((t: { text: string }) => t.text),
    })
  } catch (error) {
    console.log("[v0] Translation error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la traduction", details: String(error) },
      { status: 500 }
    )
  }
}
