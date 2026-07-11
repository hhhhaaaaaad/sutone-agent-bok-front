/**
 * 修复 AI 生成 Markdown 的常见结构问题。
 * 策略：先用大阈值确保标题+正文拆分，再合并多余空行。
 */

/** 标题行后紧跟正文 → 在标题后插入空行 */
function fixHeadingBodyMerge(md: string): string {
  // 贪心策略：标题取尽可能多的字符（8-30 字），正文至少 30 字才触发
  // 避免非贪婪导致标题被切成 2 字碎片
  return md.replace(
    /^(#{1,3})\s+([^\n]{8,30})([^\n]{30,})$/gm,
    (_full: string, hashes: string, title: string, body: string) => {
      const trimmedTitle = title.trimEnd();
      const trimmedBody = body.trimStart();
      return `${hashes} ${trimmedTitle}\n\n${trimmedBody}`;
    },
  );
}

/** Merge excessive blank lines (3+) down to 2 (one blank line) */
function collapseBlanks(md: string): string {
  return md.replace(/\n{3,}/g, "\n\n");
}

/** 单个 # 后面没空格的补上 */
function fixHeadingSpace(md: string): string {
  return md.replace(/^(#{1,6})([^\s#\n])/gm, "$1 $2");
}

/** Remove empty lines with just whitespace */
function trimTrailingSpaces(md: string): string {
  return md.replace(/[ \t]+$/gm, "");
}

export function normalizeMarkdown(md: string): string {
  let result = md;
  result = fixHeadingSpace(result);
  result = fixHeadingBodyMerge(result);
  result = collapseBlanks(result);
  result = trimTrailingSpaces(result);
  return result;
}
