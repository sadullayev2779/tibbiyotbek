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

// query: inglizcha qidiruv so‘zi, drug: dorining inglizcha generik nomi,
// condition: asosiy kasallik nomi (inglizcha), topic: savol mavzusi
type SearchInput = { query: string; drug: string; condition: string; topic: string };

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

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

// OpenAlex annotatsiyani "inverted index" ko‘rinishida beradi; matnga qaytaramiz
function rebuildAbstract(index: Record<string, number[]> | null | undefined): string {
  if (!index) return '';
  const words: string[] = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const pos of positions) words[pos] = word;
  }
  return words.filter(Boolean).join(' ');
}

async function getJson<T>(url: string, timeoutMs: number): Promise<T | null> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

function cleanDrugName(drug: string): string {
  return drug.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
}

// ---- Mavzular: PubMed qidiruvini ixtisoslashgan yo‘nalishga toraytirish (MeSH) ----
// Mos natija kam bo‘lsa, filtr avtomatik olib tashlanadi.
const TOPIC_FILTERS: Record<string, string> = {
  phytotherapy: '("Plants, Medicinal"[Mesh] OR "Phytotherapy"[Mesh] OR "Medicine, Traditional"[Mesh])',
  aromatherapy: '("Aromatherapy"[Mesh] OR "Oils, Volatile"[Mesh])',
  apitherapy: '("Apitherapy"[Mesh] OR "Propolis"[Mesh] OR "Honey"[Mesh] OR "Bee Venoms"[Mesh])',
  nutrition: '("Diet Therapy"[Mesh] OR "Nutrition Therapy"[Mesh] OR "Diet"[Mesh])',
  physiotherapy: '("Physical Therapy Modalities"[Mesh] OR "Physical Therapy Specialty"[Mesh])',
  balneology: '("Balneology"[Mesh] OR "Spa Therapy"[Mesh] OR "Hydrotherapy"[Mesh])',
  sports: '("Sports Medicine"[Mesh] OR "Athletic Injuries"[Mesh] OR "Exercise"[Mesh])',
  rehabilitation: '("Rehabilitation"[Mesh])',
  preventive: '("Preventive Medicine"[Mesh] OR "Primary Prevention"[Mesh])',
  toxicology: '("Toxicology"[Mesh] OR "Poisoning"[Mesh] OR "Drug-Related Side Effects and Adverse Reactions"[Mesh])',
  genetics: '("Genetic Diseases, Inborn"[Mesh] OR "Genetics, Medical"[Mesh])',
  epidemiology: '("Epidemiology"[Mesh] OR "Epidemiologic Studies"[Mesh])',
  cardiology: '("Cardiovascular Diseases"[Mesh])',
  neurology: '("Nervous System Diseases"[Mesh])',
  oncology: '("Neoplasms"[Mesh])',
  pediatrics: '("Pediatrics"[Mesh])',
};
const TOPICS = ['general', 'trials', ...Object.keys(TOPIC_FILTERS)];

// ---- 1) PubMed (NCBI E-utilities) ----
const NCBI = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const REVIEW_FILTER = '(review[pt] OR systematic review[pt] OR meta-analysis[pt] OR guideline[pt])';

function ncbiParams(): string {
  const key = process.env.NCBI_API_KEY; // ixtiyoriy: so‘rovlar limitini oshiradi
  return `tool=tibbiyotbek${key ? `&api_key=${encodeURIComponent(key)}` : ''}`;
}

async function pubmedSearchIds(term: string): Promise<string[]> {
  const url = `${NCBI}/esearch.fcgi?db=pubmed&retmode=json&retmax=5&sort=relevance&${ncbiParams()}&term=${encodeURIComponent(term)}`;
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

async function fetchPubMedDocs(ids: string[]): Promise<SourceDoc[]> {
  if (ids.length === 0) return [];
  const res = await fetch(`${NCBI}/efetch.fcgi?db=pubmed&retmode=xml&id=${ids.join(',')}&${ncbiParams()}`, {
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) return [];
  return parsePubMedXml(await res.text());
}

async function searchPubMed({ query, topic }: SearchInput): Promise<SourceDoc[]> {
  const base = `(${query}) AND hasabstract`;
  const topicFilter = TOPIC_FILTERS[topic];

  // Aniqdan kengga: mavzu + sharhlar, mavzu, sharhlar, oddiy
  const attempts = [
    topicFilter ? `${base} AND ${topicFilter} AND ${REVIEW_FILTER}` : null,
    topicFilter ? `${base} AND ${topicFilter}` : null,
    `${base} AND ${REVIEW_FILTER}`,
    base,
  ].filter((t): t is string => t !== null);

  let ids: string[] = [];
  for (const term of attempts) {
    ids = await pubmedSearchIds(term);
    if (ids.length >= 2) break;
  }
  return fetchPubMedDocs(ids);
}

// ---- 2) Cochrane sharhlari (PubMed orqali, jurnal bo‘yicha filtr) ----
async function searchCochrane({ query }: SearchInput): Promise<SourceDoc[]> {
  const ids = await pubmedSearchIds(`(${query}) AND "Cochrane Database Syst Rev"[Journal] AND hasabstract`);
  const docs = await fetchPubMedDocs(ids);
  return docs.map((d) => ({ ...d, source: 'Cochrane' }));
}

// ---- 3) Europe PMC (bepul REST API) ----
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

// ---- 4) openFDA: dori yo‘riqnomalari (AQSh FDA / DailyMed) ----
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
  pharmacokinetics?: string[];
  drug_interactions?: string[];
  overdosage?: string[];
  pregnancy?: string[];
  pediatric_use?: string[];
  geriatric_use?: string[];
}

async function searchOpenFDA({ drug }: SearchInput): Promise<SourceDoc[]> {
  const name = cleanDrugName(drug);
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
    ['Pharmacokinetics', label.pharmacokinetics],
    ['Dosage and administration', label.dosage_and_administration],
    ['Contraindications', label.contraindications],
    ['Warnings', label.warnings],
    ['Adverse reactions', label.adverse_reactions],
    ['Drug interactions', label.drug_interactions],
    ['Pregnancy', label.pregnancy],
    ['Pediatric use', label.pediatric_use],
    ['Geriatric use', label.geriatric_use],
    ['Overdosage', label.overdosage],
  ];
  const text = sections
    .filter(([, value]) => value?.[0])
    .map(([title, value]) => `${title}: ${cleanText(value![0]).slice(0, 800)}`)
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

// ---- 5) ChEMBL: dorining ta’sir mexanizmi (bepul REST API) ----
async function searchChEMBL({ drug }: SearchInput): Promise<SourceDoc[]> {
  const name = cleanDrugName(drug);
  if (!name) return [];

  const found = await getJson<{ molecules?: { molecule_chembl_id?: string; pref_name?: string | null }[] }>(
    `https://www.ebi.ac.uk/chembl/api/data/molecule/search.json?q=${encodeURIComponent(name)}&limit=1`,
    6_000
  );
  const molecule = found?.molecules?.[0];
  const id = molecule?.molecule_chembl_id;
  if (!id) return [];

  const mech = await getJson<{
    mechanisms?: { mechanism_of_action?: string | null; action_type?: string | null }[];
  }>(`https://www.ebi.ac.uk/chembl/api/data/mechanism.json?molecule_chembl_id=${id}&limit=5`, 6_000);

  const rows = (mech?.mechanisms ?? []).filter((r) => r.mechanism_of_action);
  if (rows.length === 0) return [];

  const text = rows
    .map((r) => `${r.mechanism_of_action}${r.action_type ? ` (action type: ${r.action_type})` : ''}`)
    .join('; ');

  return [
    {
      key: `chembl:${id}`,
      source: 'ChEMBL',
      title: `${molecule?.pref_name ?? name}: ta’sir mexanizmi`,
      meta: `ChEMBL ${id}`,
      url: `https://www.ebi.ac.uk/chembl/compound_report_card/${id}/`,
      text: `Mechanism of action: ${text}`,
    },
  ];
}

// ---- 6) PubChem: kimyoviy ma’lumot va qisqa tavsif ----
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
  const name = cleanDrugName(drug);
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

// ---- 7) RxClass: dorining ATC (WHO) farmakologik tasnifi ----
interface RxClassResponse {
  rxclassDrugInfoList?: {
    rxclassDrugInfo?: { rxclassMinConceptItem?: { classId?: string; className?: string; classType?: string } }[];
  };
}

async function searchRxClass({ drug }: SearchInput): Promise<SourceDoc[]> {
  const name = cleanDrugName(drug);
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

// ---- 8) ClinicalTrials.gov: klinik sinovlar (faqat mavzu "trials" bo‘lsa) ----
interface CtStudy {
  protocolSection?: {
    identificationModule?: { nctId?: string; briefTitle?: string };
    statusModule?: { overallStatus?: string };
    designModule?: { phases?: string[] };
    descriptionModule?: { briefSummary?: string };
  };
}

async function searchClinicalTrials({ query, topic }: SearchInput): Promise<SourceDoc[]> {
  if (topic !== 'trials') return [];
  const url = `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(query)}&pageSize=3&format=json`;
  const data = await getJson<{ studies?: CtStudy[] }>(url, 6_000);

  const docs: SourceDoc[] = [];
  for (const study of data?.studies ?? []) {
    const p = study.protocolSection;
    const nct = p?.identificationModule?.nctId;
    const title = p?.identificationModule?.briefTitle;
    if (!nct || !title) continue;

    const status = p?.statusModule?.overallStatus ?? 'unknown';
    const phases = p?.designModule?.phases?.join(', ') || 'n/a';
    const summary = cleanText(p?.descriptionModule?.briefSummary ?? '').slice(0, 600);
    docs.push({
      key: `nct:${nct}`,
      source: 'ClinicalTrials.gov',
      title,
      meta: `${nct}, ${status}`,
      url: `https://clinicaltrials.gov/study/${nct}`,
      text: `Status: ${status}; phases: ${phases}${summary ? `\nSummary: ${summary}` : ''}`,
    });
  }
  return docs;
}

// ---- 9) Crossref: nashriyotlar deponentlagan maqolalar (annotatsiyasi borlari) ----
interface CrossrefItem {
  DOI?: string;
  title?: string[];
  abstract?: string;
  'container-title'?: string[];
  issued?: { 'date-parts'?: number[][] };
}

async function searchCrossref({ query }: SearchInput): Promise<SourceDoc[]> {
  const url =
    `https://api.crossref.org/works?query=${encodeURIComponent(query)}` +
    `&filter=${encodeURIComponent('has-abstract:true,type:journal-article,from-pub-date:2010')}` +
    `&rows=4&select=DOI,title,abstract,container-title,issued`;
  const data = await getJson<{ message?: { items?: CrossrefItem[] } }>(url, 6_000);

  const docs: SourceDoc[] = [];
  for (const item of data?.message?.items ?? []) {
    const title = item.title?.[0];
    const abstract = item.abstract ? cleanText(item.abstract) : '';
    if (!item.DOI || !title || !abstract) continue;
    docs.push({
      key: `doi:${item.DOI.toLowerCase()}`,
      source: 'Crossref',
      title: cleanText(title),
      meta: [item['container-title']?.[0], item.issued?.['date-parts']?.[0]?.[0]].filter(Boolean).join(', '),
      url: `https://doi.org/${item.DOI}`,
      text: abstract,
    });
  }
  return docs;
}

// ---- 10) OpenAlex: ochiq ilmiy ma’lumotlar bazasi ----
interface OpenAlexWork {
  id?: string;
  doi?: string | null;
  title?: string | null;
  publication_year?: number | null;
  primary_location?: { source?: { display_name?: string | null } | null } | null;
  abstract_inverted_index?: Record<string, number[]> | null;
}

async function searchOpenAlex({ query }: SearchInput): Promise<SourceDoc[]> {
  const url =
    `https://api.openalex.org/works?search=${encodeURIComponent(query)}` +
    `&filter=${encodeURIComponent('has_abstract:true,type:article,is_retracted:false')}` +
    `&per-page=4&select=id,doi,title,publication_year,primary_location,abstract_inverted_index`;
  const data = await getJson<{ results?: OpenAlexWork[] }>(url, 6_000);

  const docs: SourceDoc[] = [];
  for (const w of data?.results ?? []) {
    const abstract = rebuildAbstract(w.abstract_inverted_index);
    if (!w.title || !abstract || !(w.doi || w.id)) continue;
    const doi = w.doi?.replace(/^https?:\/\/doi\.org\//, '').toLowerCase();
    docs.push({
      key: doi ? `doi:${doi}` : `oa:${w.id}`,
      source: 'OpenAlex',
      title: cleanText(w.title),
      meta: [w.primary_location?.source?.display_name, w.publication_year].filter(Boolean).join(', '),
      url: w.doi ?? w.id!,
      text: abstract,
    });
  }
  return docs;
}

// ---- 11) MedlinePlus (NIH): kasalliklar bo‘yicha sodda, tekshirilgan tushuntirish ----
async function searchMedlinePlus({ query }: SearchInput): Promise<SourceDoc[]> {
  const url = `https://wsearch.nlm.nih.gov/ws/query?db=healthTopics&term=${encodeURIComponent(query)}&retmax=2`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6_000) });
  if (!res.ok) return [];
  const xml = await res.text();

  const docs: SourceDoc[] = [];
  for (const block of xml.split('<document ').slice(1)) {
    const link = block.match(/url="([^"]+)"/)?.[1];
    const title = cleanText(decodeEntities(block.match(/<content name="title">([\s\S]*?)<\/content>/)?.[1] ?? ''));
    const summary = cleanText(decodeEntities(block.match(/<content name="FullSummary">([\s\S]*?)<\/content>/)?.[1] ?? ''));
    if (!link || !title || !summary) continue;
    docs.push({
      key: `medlineplus:${link}`,
      source: 'MedlinePlus',
      title,
      meta: 'NIH / NLM',
      url: decodeEntities(link),
      text: summary.slice(0, 1500),
    });
  }
  return docs;
}

// ---- 12) WHO GHO: epidemiologik statistika (O‘zbekiston bo‘yicha), faqat mavzu "epidemiology" ----
interface GhoIndicators {
  value?: { IndicatorCode?: string; IndicatorName?: string }[];
}
interface GhoData {
  value?: { TimeDim?: number; Value?: string | null; NumericValue?: number | null; Dim1?: string | null }[];
}

async function searchWhoGho({ condition, topic }: SearchInput): Promise<SourceDoc[]> {
  if (topic !== 'epidemiology') return [];
  const term = condition.replace(/[^a-zA-Z\s-]/g, '').trim();
  if (!term) return [];

  const base = 'https://ghoapi.azureedge.net/api';
  const capitalized = term.charAt(0).toUpperCase() + term.slice(1);
  let indicators: GhoIndicators | null = null;
  for (const variant of [term, capitalized]) {
    const filter = encodeURIComponent(`contains(IndicatorName,'${variant}')`);
    indicators = await getJson<GhoIndicators>(`${base}/Indicator?$filter=${filter}&$top=3`, 6_000);
    if (indicators?.value?.length) break;
  }

  const lines: string[] = [];
  let firstUrl = '';
  for (const ind of (indicators?.value ?? []).slice(0, 2)) {
    if (!ind.IndicatorCode) continue;
    const dataUrl =
      `${base}/${encodeURIComponent(ind.IndicatorCode)}` +
      `?$filter=${encodeURIComponent("SpatialDim eq 'UZB'")}&$orderby=${encodeURIComponent('TimeDim desc')}&$top=3`;
    const data = await getJson<GhoData>(dataUrl, 6_000).catch(() => null);
    const rows = (data?.value ?? []).filter((r) => r.TimeDim && (r.Value || r.NumericValue !== null));
    if (rows.length === 0) continue;
    if (!firstUrl) firstUrl = dataUrl;
    const values = rows.map((r) => `${r.TimeDim}: ${r.Value ?? r.NumericValue}`).join('; ');
    lines.push(`${ind.IndicatorName} (Uzbekistan): ${values}`);
  }
  if (lines.length === 0) return [];

  return [
    {
      key: `gho:${term.toLowerCase()}`,
      source: 'WHO GHO',
      title: `${capitalized}: O‘zbekiston bo‘yicha JSST statistikasi`,
      meta: 'WHO Global Health Observatory',
      url: firstUrl,
      text: lines.join('\n'),
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
CONDITION: the main disease or health condition in English as one or two words (e.g. "tuberculosis"), or leave empty if none.
TOPIC: exactly one word from this list that best matches the question: ${TOPICS.join(', ')}. Use "trials" only if the student asks about clinical trials, and "epidemiology" if the question is about disease statistics, incidence or prevalence; otherwise use "general" when no specialty applies.
Output exactly four lines in this format and nothing else:
QUERY: ...
DRUG: ...
CONDITION: ...
TOPIC: ...

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
    const condition = clean(text.match(/CONDITION:\s*(.*)/i)?.[1]);
    const rawTopic = clean(text.match(/TOPIC:\s*(.*)/i)?.[1]).toLowerCase();
    const topic = TOPICS.includes(rawTopic) ? rawTopic : 'general';
    return query.length >= 3 ? { query, drug, condition, topic } : null;
  } catch (err) {
    console.error('Qidiruv so‘rovini tayyorlashda xato:', err);
    return null;
  }
}

// ---- Manbalar ro‘yxati ----
// max: shu manbadan javobga ko‘pi bilan nechta hujjat olinadi.
// Tartib muhim: bir xil maqola ikki manbada chiqsa, birinchisi qoladi.
const REGISTRY: Record<string, { run: (input: SearchInput) => Promise<SourceDoc[]>; max: number }> = {
  openfda: { run: searchOpenFDA, max: 1 },
  chembl: { run: searchChEMBL, max: 1 },
  rxclass: { run: searchRxClass, max: 1 },
  pubchem: { run: searchPubChem, max: 1 },
  cochrane: { run: searchCochrane, max: 2 },
  pubmed: { run: searchPubMed, max: 4 },
  europepmc: { run: searchEuropePMC, max: 3 },
  trials: { run: searchClinicalTrials, max: 2 },
  crossref: { run: searchCrossref, max: 1 },
  openalex: { run: searchOpenAlex, max: 2 },
  medlineplus: { run: searchMedlinePlus, max: 1 },
  who: { run: searchWhoGho, max: 1 },
};

// Vercel'da SOURCES o‘zgaruvchisi bilan boshqariladi, masalan: "openfda,pubmed" (bo‘sh yoki "off" — hammasi o‘chiq)
const ENABLED = (process.env.SOURCES ?? 'openfda,chembl,rxclass,pubchem,cochrane,pubmed,europepmc,trials,openalex,crossref,medlineplus,who')
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
    const normalizeTitle = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 80);
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
        const titleKey = `title:${normalizeTitle(doc.title)}`;
        // Bir xil maqola turli manbalarda chiqishi mumkin (kalit yoki sarlavha bo‘yicha aniqlanadi)
        if (seen.has(doc.key) || (titleKey.length > 12 && seen.has(titleKey))) continue;
        seen.add(doc.key);
        seen.add(titleKey);
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