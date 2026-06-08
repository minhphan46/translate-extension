export function extractTranslationOptions(content: string): string[] {
  const tagged = Array.from(content.matchAll(/<option>\s*([\s\S]*?)\s*<\/option>/giu))
    .map((match) => match[1].trim())
    .filter(Boolean);

  if (tagged.length) {
    return tagged;
  }

  const numberedBlocks: string[] = [];
  let currentBlock: string[] | null = null;

  content.split(/\r?\n/u).forEach((line) => {
    const numberedLine = line.match(/^\s*\d+[.)]\s*(.*)$/u) ?? line.match(/^\s*\d+\s+-\s+(.*)$/u);

    if (numberedLine) {
      if (currentBlock) {
        numberedBlocks.push(currentBlock.join("\n").trim());
      }
      currentBlock = [numberedLine[1].trimEnd()];
      return;
    }

    if (currentBlock) {
      currentBlock.push(line);
    }
  });

  if (currentBlock) {
    numberedBlocks.push(currentBlock.join("\n").trim());
  }

  if (numberedBlocks.length) {
    return numberedBlocks.filter(Boolean);
  }

  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
