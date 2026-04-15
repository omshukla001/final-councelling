import { CheckCircle2 } from "lucide-react";

// Component to smartly parse and format raw text blobs into modern UI elements
const FormattedTextLayout = ({ text }: { text: string }) => {
  if (!text) return null;

  const parseBlocks = (rawText: string) => {
    const rawLines = rawText.split('\n').filter(l => l.trim().length > 0);
    const blocks: any[] = [];
    let currentTable: any[] = [];

    for (const rawLine of rawLines) {
      const line = rawLine.trim();

      // Ignore ASCII horizontal lines (only +, -, =, and spaces)
      if (/^[\+\-\=\s\_]{3,}$/.test(line)) continue;

      let cols: string[] = [];
      if (line.includes('|')) {
        // handle ASCII table columns like "| Samsung | Amazon | Google |"
        cols = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
      } else {
        // Look for 2+ spaces or tabs to demarcate columns
        // We use rawLine to preserve leading spaces as empty first columns
        const normalizedLine = rawLine.replace(/\r/g, '').replace(/\s{2,}/g, '\t');
        cols = normalizedLine.split('\t').map(c => c.trim());

        // Remove trailing empty strings to prevent accidental empty right columns
        while (cols.length > 0 && cols[cols.length - 1] === '') {
          cols.pop();
        }

        // Heuristic: If any split "column" is actually a massively long sentence (e.g. > 80 chars),
        // this is highly likely a regular text paragraph with formatting artifacts, NOT a data table.
        // Force it to be parsed as a single column paragraph.
        if (cols.length > 1 && !line.includes('|')) {
          const hasVeryLongCell = cols.some(c => c.length > 80);
          if (hasVeryLongCell) {
            cols = [line];
          }
        }

        // If a line is just indented text, it might parse as ["", "Text"].
        // We don't want to parse standard indented bullets as 2-col tables.
        if (cols.length === 2 && cols[0] === '' && line.length > 0) {
          const isBullet = line.match(/^[\-•*]\s/) || line.match(/^\d+\.\s/);
          const isPrice = line.match(/^(.*?)\s+([\d,]+(?:\.\d+)?\/-|[A-Z]+|\d+(?:\.\d+)?)$/);
          if (!isPrice && !isBullet) {
            cols = [cols[1]];
          }
        }
      }

      // Look for trailing amounts (e.g. 87 ,000/- or 1500)
      const priceMatch = line.match(/^(.*?)\s+([\d,]+(?:\.\d+)?\/-|[A-Z]+|\d+(?:\.\d+)?)$/);

      // If it looks like a bullet
      const isBullet = line.match(/^[\-•*]\s/) || line.match(/^\d+\.\s/);
      // Skip if it accidentally caught a number list as a price

      if (cols.length >= 2) {
        currentTable.push(cols);
      } else if (priceMatch && !isBullet && !line.includes('|')) {
        currentTable.push([priceMatch[1].trim(), priceMatch[2].trim()]);
      } else {
        if (currentTable.length > 0) {
          blocks.push({ type: 'table', rows: currentTable });
          currentTable = [];
        }

        if (isBullet) {
          blocks.push({ type: 'bullet', content: line.replace(/^[\-•*]\s|^\d+\.\s/, '') });
        } else {
          // Check if it's a heading (short, title cased, no punctuation at end)
          const isHeading = line.length < 60 && !line.match(/[.,:]$/) && line === line.replace(/^\S/, c => c.toUpperCase());
          blocks.push({ type: isHeading ? 'heading' : 'paragraph', content: line });
        }
      }
    }

    if (currentTable.length > 0) blocks.push({ type: 'table', rows: currentTable });

    // Post-process tables to ensure jagged arrays are safely filled uniformly
    for (const block of blocks) {
      if (block.type === 'table') {
        let maxCols = 0;
        block.rows.forEach((r: any[]) => { if (r.length > maxCols) maxCols = r.length; });

        block.rows = block.rows.map((row: any[]) => {
          let newRow = [...row];

          // Heuristic for Fee Tables:
          // If the "Gen/OBC" sub-header row was stripped of its leading spaces,
          // and the table has 3+ columns, we manually shift it right by 1 to align properly under FEES.
          if (maxCols >= 3 && newRow.length === 2 && newRow[0] !== "" &&
            (newRow[0].toLowerCase().includes('gen/obc') || newRow[0].toLowerCase().includes('general'))) {
            newRow = ["", ...newRow];
          }

          // Heuristic for Year/Semester tables:
          // If a row has exactly half (or a clean fraction) the columns of maxCols (e.g. 4 "Years" vs 8 "Semesters"),
          // visually spread them out natively without needing explicit HTML colspans, so they don't pile up on the left.
          if (newRow.length > 0 && maxCols % newRow.length === 0 && newRow.length !== maxCols) {
            const multiplier = maxCols / newRow.length;
            const expandedRow = [];
            for (const item of newRow) {
              expandedRow.push(item);
              // Add empty padding for the remaining columns covered by this header
              for (let i = 1; i < multiplier; i++) expandedRow.push("");
            }
            newRow = expandedRow;
          }

          // Right-pad any remaining empty cells so HTML table borders render cleanly
          while (newRow.length < maxCols) newRow.push("");
          return newRow;
        });
      }
    }

    return blocks;
  };

  const blocks = parseBlocks(text);

  return (
    <div className="space-y-6 text-foreground/90">
      {blocks.map((block, idx) => {
        if (block.type === 'heading') {
          return <h4 key={idx} className="text-lg font-bold text-foreground mt-6 mb-3 border-b border-border pb-2">{block.content}</h4>;
        }
        if (block.type === 'paragraph') {
          return <p key={idx} className="text-[14px] leading-relaxed mb-4 text-muted-foreground font-medium">{block.content}</p>;
        }
        if (block.type === 'bullet') {
          return (
            <div key={idx} className="flex gap-3 items-start mb-3 bg-muted/40 p-4 rounded-xl border border-border/50 hover:bg-muted transition-colors">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span className="text-[14px] leading-relaxed font-medium">{block.content}</span>
            </div>
          );
        }
        if (block.type === 'table') {
          // If all rows have exactly 2 columns, render as key-value cards
          const isKeyValue = block.rows.every((r: any[]) => r.length === 2);
          if (isKeyValue) {
            return (
              <div key={idx} className="grid sm:grid-cols-2 gap-4 my-6">
                {block.rows.map((row: any[], rIdx: number) => (
                  <div key={rIdx} className="bg-background border border-border p-4 rounded-2xl shadow-sm flex flex-col justify-between hover:border-primary/40 transition-colors">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{row[0]}</span>
                    <span className="text-lg font-black text-foreground">{row[1]}</span>
                  </div>
                ))}
              </div>
            );
          }
          // Otherwise render as a styled table
          return (
            <div key={idx} className="overflow-x-auto rounded-2xl border border-border my-6 shadow-sm">
              <table className="w-full text-[14px] text-left">
                <tbody className="divide-y divide-border/50">
                  {block.rows.map((row: any[], rIdx: number) => (
                    <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-background hover:bg-muted/50" : "bg-muted/30 hover:bg-muted/80"}>
                      {row.map((cell: string, cIdx: number) => (
                        <td key={cIdx} className="px-4 py-3 font-medium text-foreground font-bold border-r border-border/10 last:border-r-0">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default FormattedTextLayout;
