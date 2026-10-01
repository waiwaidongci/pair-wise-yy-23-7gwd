import { useMemo } from "react";
import { parsePattern } from "../components/common/BrailleCell";

/** 把 "1,2,5" 形式的点阵解析成渲染与判分都能用的结构 */
export function useBraillePattern(pattern: string) {
  return useMemo(() => {
    const dots = parsePattern(pattern);
    return {
      dots,
      list: [...dots].sort((a, b) => a - b),
      isEmpty: dots.size === 0,
      matches: (other: string) => {
        const target = parsePattern(other);
        return target.size === dots.size && [...dots].every((dot) => target.has(dot));
      }
    };
  }, [pattern]);
}
