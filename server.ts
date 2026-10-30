import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// 2. Parse PDF / Document Bank Statement
app.post('/api/statements/parse', async (req, res) => {
  try {
    const { fileBase64, mimeType, fileName } = req.body;

    if (!fileBase64) {
      return res.status(400).json({ error: 'Chýba súbor v požiadavke.' });
    }

    const ai = getGeminiClient();

    const prompt = `Si špecializovaný analyzátor bankových výpisov. Analyzuj tento dokument (${fileName || 'vypis'}).
Dôkladne extrahuj:
- Názov banky / inštitúcie (napr. Tatra banka, Slovenská sporiteľňa, ČSOB, VÚB, Revolut, mBank, Raiffeisen atď.)
- Posledné 4 číslice účtu / IBAN
- Obdobie výpisu
- Mena je výhradne '€'
- Zoznam všetkých transakcií:
  - dátum v ISO formáte YYYY-MM-DD
  - popis / obchodník (očistený názov)
  - suma (kladné číslo, suma v €)
  - typ: 'expense' (výdavok) alebo 'income' (príjem)
  - kategória: jedna z [Potraviny a domácnosť, Bývanie a nájom, Energie a účty, Reštaurácie a kaviarne, Doprava a pohonné hmoty, Nákupy a osobné výdavky, Zdravie a šport, Zábava a predplatné, Cestovanie a dovolenka, Deti a domáci miláčikovia, Príjem a mzda, Iné]
  - isShared: boolean, či ide zvyčajne o spoločný výdavok páru (nájom, energie, nákup potravín do domácnosti) alebo súkromný výdavok jednotlivca.

Vráť výhradne JSON podľa schémy.`;

    const filePart = {
      inlineData: {
        mimeType: mimeType || 'application/pdf',
        data: fileBase64,
      },
    };

    let responseText: string | undefined;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: { parts: [filePart, { text: prompt }] },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              bankName: { type: Type.STRING },
              accountNumberMasked: { type: Type.STRING },
              statementPeriod: { type: Type.STRING },
              currency: { type: Type.STRING },
              detectedOwner: { type: Type.STRING },
              suggestedAccountType: {
                type: Type.STRING,
                description: "'shared' or 'private'",
              },
              transactions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING },
                    description: { type: Type.STRING },
                    amount: { type: Type.NUMBER },
                    type: { type: Type.STRING, description: "'expense' or 'income'" },
                    category: { type: Type.STRING },
                    isShared: { type: Type.BOOLEAN },
                    notes: { type: Type.STRING },
                  },
                  required: ['date', 'description', 'amount', 'type', 'category'],
                },
              },
            },
            required: ['bankName', 'currency', 'transactions'],
          },
        },
      });
      responseText = response.text;
    } catch (err: any) {
      console.warn('gemini-4-argon failed, falling back to gemini-3.8-flash:', err?.message);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts: [filePart, { text: prompt }] },
        config: { responseMimeType: 'application/json' },
      });
      responseText = fallbackResponse.text;
    }

    if (!responseText) {
      return res.status(500).json({ error: 'Žiadna odpoveď zo spracovania výpisu.' });
    }

    const parsedData = JSON.parse(responseText);
    parsedData.currency = '€';
    res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Error parsing statement:', error);
    res.status(500).json({
      error: error.message || 'Nepodarilo sa spracovať bankový výpis.',
    });
  }
});

// 3. Analyze Image (Photo of paper receipt / pokladničný blok) using gemini-4-argon
app.post('/api/receipts/analyze', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Chýba obrázok účtenky.' });
    }

    const ai = getGeminiClient();

    const prompt = `Si expert na analýzu slovenských a európskych pokladničných dokladov a faktúr pomocou modelu gemini-4-argon.
Analyzuj túto fotografiu účtenky alebo bločku.
Všetky sumy sú v mene EUR (€).
Extrahuj v slovenskom jazyku:
1. Obchodník / Predajňa (napr. Lidl, Kaufland, Billa, Tesco, DM, reštaurácia)
2. Dátum nákupu (YYYY-MM-DD)
3. Celková suma v € (numeric)
4. Daň / DPH v € ak je viditeľná
5. Položky nákupu (názov, počet, cena)
6. Kategória: jedna z [Potraviny a domácnosť, Bývanie a nájom, Energie a účty, Reštaurácie a kaviarne, Doprava a pohonné hmoty, Nákupy a osobné výdavky, Zdravie a šport, Zábava a predplatné, Cestovanie a dovolenka, Deti a domáci miláčikovia, Iné]
7. Odporúčanie pre pár:
   - Je to spoločný výdavok ('shared' = do domácnosti) alebo súkromný ('private' = osobná potreba)?
   - Stručné zdôvodnenie v slovenčine (1 veta).
   - Polovičný podiel na osobu (50/50).
8. Krátke zhrnutie nákupu v slovenčine.

Vráť striktne JSON podľa schémy.`;

    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: imageBase64,
      },
    };

    let responseText: string | undefined;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              merchant: { type: Type.STRING },
              date: { type: Type.STRING },
              totalAmount: { type: Type.NUMBER },
              currency: { type: Type.STRING },
              taxAmount: { type: Type.NUMBER },
              category: { type: Type.STRING },
              suggestedAccountType: { type: Type.STRING },
              isSharedExpense: { type: Type.BOOLEAN },
              splitRationale: { type: Type.STRING },
              splitPerPerson: { type: Type.NUMBER },
              summary: { type: Type.STRING },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    quantity: { type: Type.NUMBER },
                    price: { type: Type.NUMBER },
                  },
                },
              },
            },
            required: ['merchant', 'totalAmount', 'category', 'isSharedExpense', 'splitRationale'],
          },
        },
      });
      responseText = response.text;
    } catch (err: any) {
      console.warn('gemini-4-argon failed, falling back to gemini-3.8-flash:', err?.message);
      const fallback = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseMimeType: 'application/json' },
      });
      responseText = fallback.text;
    }

    if (!responseText) {
      return res.status(500).json({ error: 'Nepodarilo sa vyhodnotiť účtenku.' });
    }

    const receiptResult = JSON.parse(responseText);
    receiptResult.currency = '€';
    res.json({
      success: true,
      data: receiptResult,
    });
  } catch (error: any) {
    console.error('Error analyzing image:', error);
    res.status(500).json({
      error: error.message || 'Nepodarilo sa analyzovať účtenku.',
    });
  }
});

// 4. Couples' Financial Advisor Chatbot (Multi-turn in Slovak)
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, financialContext, modelPreference } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Pole správ je povinné.' });
    }

    const ai = getGeminiClient();

    let selectedModel = 'gemini-3.8-flash';
    if (modelPreference === 'gemini-4-argon') {
      selectedModel = 'gemini-4-argon';
    } else if (modelPreference === 'gemini-3.1-flash-lite') {
      selectedModel = 'gemini-3.1-flash-lite';
    }

    const systemInstruction = `Si DuoAdvisor, empatický, rozumný a presný finančný poradca pre páry.
Komunikuješ v plynulom, priateľskom a profesionálnom slovenskom jazyku.
Používaš výhradne menu EURO (€).
Tvoja rola a finančný model páru:
1. Pár má spoločný účet na spoločné výdavky domácnosti (nájom, energie, potraviny, drogéria) a súkromné účty na osobnú radosť bez kontroly a výčitiek.
2. DÔLEŽITÉ: Pár sa NIKDY nevyrovnáva navzájom peer-to-peer a NEPOUŽÍVA rovný diel 50/50.
3. Namiesto toho každý partner posiela na SPOLOČNÝ BANKOVÝ ÚČET svoj podiel zo mzdy podľa percentuálneho pomeru ich mesačných príjmov. Ak partner zaplatil spoločný výdavok zo svojho súkromného účtu, odpočíta sa to z jeho prevodu na spoločný účet.
4. Vždy odpovedať neutrálne, podporne a konštruktívne s konkrétnymi sumami v eurách (€).
5. Používať skutočné dáta o výdavkoch, príjmoch a požadovaných prevodoch z kontextu nižšie.

AKTUÁLNE FINANČNÉ DÁTA PÁRU:
${financialContext ? JSON.stringify(financialContext, null, 2) : 'Žiadne dáta.'}`;

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    let response;
    try {
      response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config: { systemInstruction },
      });
    } catch (err: any) {
      if (selectedModel !== 'gemini-3.8-flash') {
        console.warn(`Model ${selectedModel} zlyhal, prepínam na gemini-3.8-flash:`, err?.message);
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: { systemInstruction },
        });
      } else {
        throw err;
      }
    }

    res.json({
      success: true,
      reply: response.text || 'Ospravedlňujem sa, nepodarilo sa vygenerovať odpoveď.',
      modelUsed: selectedModel,
    });
  } catch (error: any) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({
      error: error.message || 'Chyba v chatovacej službe.',
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await (await import('vite')).createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DuoSpend Server beží na porte http://0.0.0.0:${PORT} (${process.env.NODE_ENV || 'vývoj'})`);
  });
}

startServer().catch((err) => {
  console.error('Chyba pri štarte servera:', err);
  process.exit(1);
});
