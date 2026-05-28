require('dotenv').config();

const analyzeReport = async (type, description, location) => {
  const prompt = `Sei un sistema di analisi per segnalazioni ambientali urbane.
Analizza questa segnalazione e rispondi SOLO con un oggetto JSON valido, senza markdown o testo aggiuntivo.

Segnalazione:
- Tipo: ${type}
- Luogo: ${location}
- Descrizione: ${description}

Valuta:
1. severity: gravità del problema ("bassa", "media", "alta")
2. isFake: se la segnalazione sembra falsa, spam, inventata o il tipo di segnalazione non è coerente con la descrizione (true/false)
3. reason: breve spiegazione in italiano (max 100 caratteri)

Rispondi SOLO con questo JSON:
{"severity": "...", "isFake": ..., "reason": "..."}`

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.1
      })
    }
  )

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`Groq API error ${response.status}: ${errorData.error?.message || response.statusText}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content

  if (!text) throw new Error('Risposta AI non valida')

  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

module.exports = { analyzeReport }