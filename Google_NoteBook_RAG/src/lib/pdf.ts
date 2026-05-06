import pdf from "pdf-parse";

export interface ParsedDoc {
  text: string;
  // byte offsets in `text` where each new page starts (excluding page 1)
  pageBreaks: number[];
  numPages: number;
}

/**
 * Parses a PDF buffer into raw text plus page-break offsets so chunks can be
 * tagged with their source page.
 */
export async function parsePdf(buffer: Buffer): Promise<ParsedDoc> {
  const breaks: number[] = [];
  let acc = "";

  const data = await pdf(buffer, {
    pagerender: async (pageData: {
      getTextContent: (opts: {
        normalizeWhitespace: boolean;
        disableCombineTextItems: boolean;
      }) => Promise<{ items: { str: string; transform?: number[] }[] }>;
    }) => {
      const tc = await pageData.getTextContent({
        normalizeWhitespace: true,
        disableCombineTextItems: false,
      });
      const text = tc.items.map((it) => it.str).join(" ");
      if (acc.length > 0) breaks.push(acc.length);
      acc += text + "\n";
      return text;
    },
  });

  return {
    text: acc.length > 0 ? acc : data.text,
    pageBreaks: breaks,
    numPages: data.numpages,
  };
}
