// Ilmiy manbalar moduli.
// Har bir manba alohida funksiya bo‘lib, SourceDoc[] qaytaradi.
// Yangi manba qo‘shish: funksiya yozing va pastdagi REGISTRY ga qo‘shing.

export type SourceDoc = {
  key: string; // takrorlanishni aniqlash uchun (masalan, pmid:123)
  source: string; // ko‘rsatiladigan manba nomi
  title: string;
  meta: string; // jurnal, yil va h.k.
  url: string;
  text: string; // annotatsiya yoki yo‘riqnoma matni
};

type SearchInput = { query: string; drug: string };

// ---- Yordamchilar ----
function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

async function getJson<T>(url: string, timeoutMs: number): Promise<T | null> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

// ---- 1) PubMed (NCBI E-utilities) ----
const NCBI = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

function ncbiParams(): string {
  const key = process.env.NCBI_API_KEY; // ixtiyoriy: so‘rovlar limitini oshiradi
  return `tool=tibbiyotbek${key ? `&api_key=${encodeURIComponent(key)}` : ''}`;
}

async function pubmedSearchIds(term: string): Promise<string[]> {
  const url = `${NCBI}/esearch.fcgi?db=pubmed&retmode=json&retmax=4&sort=relevance&${ncbiParams()}&term=${encodeURIComponent(term)}`;
  const data = await getJson<{ esearchresult?: { idlist?: string[] } }>(url, 5_000);
  return data?.esearchresult?.idlist ?? [];
}

function parsePubMedXml(xml: string): SourceDoc[] {
  return xml
    .split('<PubmedArticle>')
    .slice(1)
    .map((block) => {
      const pmid = block.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1] ?? '';
      const title = cleanText(block.match(/<ArticleTitle[^>]*>([\s\S]*?)<\/ArticleTitle>/)?.[1] ?? '');
      const journal = cleanText(block.match(/<Journal>[\s\S]*?<Title>([\s\S]*?)<\/Title>/)?.[1] ?? '');
      const year = block.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/)?.[1] ?? '';
      const text = [...block.matchAll(/<AbstractText([^>]*)>([\s\S]*?)<\/AbstractText>/g)]
        .map((m) => {
          const label = m[1].match(/Label="([^"]+)"/)?.[1];
          const body = cleanText(m[2]);
          return label ? `${label}: ${body}` : body;
        })
        .join(' ');
      return {
        key: `pmid:${pmid}`,
        source: 'PubMed',
        title,
        meta: [journal, year].filter(Boolean).join(', '),
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        text,
        pmid,
      };
    })
    .filter((d) => d.pmid && d.title && d.text)
    .map(({ pmid: _pmid, ...doc }) => doc);
}

async function searchPubMed({ query }: SearchInput): Promise<SourceDoc[]> {
  // Avval sharhlar, meta-tahlillar va qo‘llanmalarni qidiramiz; kam bo‘lsa, kengroq
  let ids = await pubmedSearchIds(
    `(${query}) AND hasabstract AND (review[pt] OR systematic review[pt] OR meta-analysis[pt] OR guideline[pt])`
  );
  if (ids.length < 2) ids = await pubmedSearchIds(`(${query}) AND hasabstract`);
  if (ids.length === 0) return [];

  const res = await fetch(`${NCBI}/efetch.fcgi?db=pubmed&retmode=xml&id=${ids.join(',')}&${ncbiParams()}`, {
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) return [];
  return parsePubMedXml(await res.text());
}

// ---- 2) Europe PMC (bepul REST API) ----
interface EuropePmcResult {
  id?: string;
  source?: string;
  pmid?: string;
  title?: string;
  journalTitle?: string;
  pubYear?: string;
  abstractText?: string;
}

async function searchEuropePMC({ query }: SearchInput): Promise<SourceDoc[]> {
  // Preprintlarsiz (faqat MEDLINE va PMC)
  const q = `(${query}) AND HAS_ABSTRACT:y AND (SRC:MED OR SRC:PMC)`;
  const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(q)}&format=json&resultType=core&pageSize=6`;
  const data = await getJson<{ resultList?: { result?: EuropePmcResult[] } }>(url, 6_000);

  const docs: SourceDoc[] = [];
  for (const r of data?.resultList?.result ?? []) {
    if (!r.id || !r.source || !r.title || !r.abstractText) continue;
    docs.push({
      key: r.pmid ? `pmid:${r.pmid}` : `epmc:${r.source}:${r.id}`,
      source: 'Europe PMC',
      title: cleanText(r.title),
      meta: [r.journalTitle, r.pubYear].filter(Boolean).join(', '),
      url: `https://europepmc.org/article/${r.source}/${r.id}`,
      text: cleanText(r.abstractText),
    });
  }
  return docs;
}

// ---- 3) openFDA: dori yo‘riqnomalari (AQSh FDA / DailyMed) ----
interface FdaLabel {
  set_id?: string;
  openfda?: { generic_name?: string[]; brand_name?: string[] };
  indications_and_usage?: string[];
  mechanism_of_action?: string[];
  clinical_pharmacology?: string[];
  adverse_reactions?: string[];
  contraindications?: string[];
  warnings?: string[];
  dosage_and_administration?: string[];
}

async function searchOpenFDA({ drug }: SearchInput): Promise<SourceDoc[]> {
  const name = drug.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
  if (!name) return [];

  const search = `openfda.generic_name:"${name}" OR openfda.substance_name:"${name}"`;
  const url = `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(search)}&limit=1`;
  const data = await getJson<{ results?: FdaLabel[] }>(url, 6_000);
  const label = data?.results?.[0];
  if (!label?.set_id) return [];

  const sections: [string, string[] | undefined][] = [
    ['Indications', label.indications_and_usage],
    ['Mechanism of action', label.mechanism_of_action],
    ['Clinical pharmacology', label.clinical_pharmacology],
    ['Adverse reactions', label.adverse_reactions],
    ['Contraindications', label.contraindications],
    ['Warnings', label.warnings],
    ['Dosage', label.dosage_and_administration],
  ];
  const text = sections
    .filter(([, value]) => value?.[0])
    .map(([title, value]) => `${title}: ${cleanText(value![0]).slice(0, 450)}`)
    .join('\n');
  if (!text) return [];

  const generic = label.openfda?.generic_name?.[0] ?? name;
  return [
    {
      key: `fda:${label.set_id}`,
      source: 'openFDA',
      title: `${generic}: rasmiy dori yo‘riqnomasi (FDA label)`,
      meta: 'AQSh FDA / DailyMed',
      url: `https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=${label.set_id}`,
      text,
    },
  ];
}

// ---- 4) PubChem: kimyoviy ma’lumot va qisqa tavsif ----
interface PubChemDescriptions {
  InformationList?: {
    Information?: { CID?: number; Title?: string; Description?: string; DescriptionSourceName?: string }[];
  };
}
interface PubChemProperties {
  PropertyTable?: {
    Properties?: { CID?: number; MolecularFormula?: string; MolecularWeight?: string | number; IUPACName?: string }[];
  };
}

async function searchPubChem({ drug }: SearchInput): Promise<SourceDoc[]> {
  const name = drug.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
  if (!name) return [];

  const base = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}`;
  const [desc, props] = await Promise.all([
    getJson<PubChemDescriptions>(`${base}/description/JSON`, 6_000).catch(() => null),
    getJson<PubChemProperties>(`${base}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`, 6_000).catch(
      () => null
    ),
  ]);

  const prop = props?.PropertyTable?.Properties?.[0];
  const infos = (desc?.InformationList?.Information ?? []).filter((i) => i.Description);
  const cid = prop?.CID ?? infos[0]?.CID;
  if (!cid) return [];

  const lines: string[] = [];
  if (prop) {
    lines.push(
      `Formula: ${prop.MolecularFormula ?? '—'}; molecular weight: ${prop.MolecularWeight ?? '—'}; IUPAC name: ${prop.IUPACName ?? '—'}`
    );
  }
  for (const info of infos.slice(0, 2)) {
    lines.push(`Description (${info.DescriptionSourceName ?? 'PubChem'}): ${cleanText(info.Description!).slice(0, 450)}`);
  }
  if (lines.length === 0) return [];

  return [
    {
      key: `pubchem:${cid}`,
      source: 'PubChem',
      title: `${name}: kimyoviy ma’lumot`,
      meta: `CID ${cid}`,
      url: `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`,
      text: lines.join('\n'),
    },
  ];
}

// ---- 5) RxClass: dorining ATC (WHO) farmakologik tasnifi ----
interface RxClassResponse {
  rxclassDrugInfoList?: {
    rxclassDrugInfo?: { rxclassMinConceptItem?: { classId?: string; className?: string; classType?: string } }[];
  };
}

async function searchRxClass({ drug }: SearchInput): Promise<SourceDoc[]> {
  const name = drug.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
  if (!name) return [];

  const url = `https://rxnav.nlm.nih.gov/REST/rxclass/class/byDrugName.json?drugName=${encodeURIComponent(name)}&relaSource=ATC`;
  const data = await getJson<RxClassResponse>(url, 6_000);

  const seen = new Set<string>();
  const classes: string[] = [];
  for (const info of data?.rxclassDrugInfoList?.rxclassDrugInfo ?? []) {
    const item = info.rxclassMinConceptItem;
    if (!item?.classId || !item.className || seen.has(item.classId)) continue;
    seen.add(item.classId);
    classes.push(`${item.classId} ${item.className}`);
    if (classes.length >= 8) break;
  }
  if (classes.length === 0) return [];

  return [
    {
      key: `rxclass:${name.toLowerCase()}`,
      source: 'RxClass (ATC)',
      title: `${name}: ATC farmakologik tasnifi`,
      meta: 'NLM RxClass / WHO ATC',
      url,
      text: `ATC classes: ${classes.join('; ')}`,
    },
  ];
}

// ---- Qidiruv so‘rovini tayyorlash (o‘zbekchadan inglizchaga) ----
async function buildSearchInput(
  apiKey: string,
  model: string,
  userTexts: string
): Promise<SearchInput | null> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Convert the student's latest question(s) below into search inputs for medical literature databases.
QUERY: a concise English search query (3-8 words), e.g. "paracetamol mechanism of action". If a follow-up such as "its effects" refers to the previous question, use the previous topic.
DRUG: the single most relevant generic drug name in English (e.g. "paracetamol"), or leave empty if the question is about a drug class, a disease, or no specific drug.
Output exactly two lines in this format and nothing else:
QUERY: ...
DRUG: ...

Questions:
${userTexts}`,
                },
              ],
            },
          ],
          generationConfig: { temperature: 0, maxOutputTokens: 256 },
        }),
        signal: AbortSignal.timeout(7_000),
      }
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('');
    const clean = (s: string | undefined) =>
      (s ?? '').replace(/[^a-zA-Z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);

    const query = clean(text.match(/QUERY:\s*(.*)/i)?.[1]);
    const drug = clean(text.match(/DRUG:\s*(.*)/i)?.[1]);
    return query.length >= 3 ? { query, drug } : null;
  } catch (err) {
    console.error('Qidiruv so‘rovini tayyorlashda xato:', err);
    return null;
  }
}

// ---- Manbalar ro‘yxati ----
// max: shu manbadan javobga ko‘pi bilan nechta hujjat olinadi
const REGISTRY: Record<string, { run: (input: SearchInput) => Promise<SourceDoc[]>; max: number }> = {
  openfda: { run: searchOpenFDA, max: 1 },
  rxclass: { run: searchRxClass, max: 1 },
  pubchem: { run: searchPubChem, max: 1 },
  pubmed: { run: searchPubMed, max: 3 },
  europepmc: { run: searchEuropePMC, max: 2 },
};

// Vercel'da SOURCES o‘zgaruvchisi bilan boshqariladi, masalan: "openfda,pubmed" (bo‘sh yoki "off" — hammasi o‘chiq)
const ENABLED = (process.env.SOURCES ?? 'openfda,rxclass,pubchem,pubmed,europepmc')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter((s) => s in REGISTRY);

export async function gatherSources(
  apiKey: string,
  model: string,
  userTexts: string,
  budgetMs: number
): Promise<SourceDoc[]> {
  if (ENABLED.length === 0) return [];

  const work = (async () => {
    const input = await buildSearchInput(apiKey, model, userTexts);
    if (!input) return [];

    const settled = await Promise.allSettled(ENABLED.map((name) => REGISTRY[name].run(input)));

    const seen = new Set<string>();
    const docs: SourceDoc[] = [];
    settled.forEach((result, i) => {
      const name = ENABLED[i];
      if (result.status !== 'fulfilled') {
        console.error(`Manba xatosi (${name}):`, result.reason);
        return;
      }
      let taken = 0;
      for (const doc of result.value) {
        if (taken >= REGISTRY[name].max) break;
        if (seen.has(doc.key)) continue; // masalan, PubMed va Europe PMC bir xil maqola
        seen.add(doc.key);
        docs.push(doc);
        taken++;
      }
    });
    return docs;
  })();

  const timeout = new Promise<SourceDoc[]>((resolve) => setTimeout(() => resolve([]), budgetMs));
  try {
    return await Promise.race([work, timeout]);
  } catch (err) {
    console.error('Manbalarni yig‘ishda xato:', err);
    return [];
  }
}
