import { Adapter } from '../types.ts';
import { fxVcb } from './fx_vcb.ts';
import { rss } from './rss.ts';
import { fxFree, goldDoji, goldMihong, goldPnj, goldSjc } from './gold.ts';

export const adapters: Record<string, Adapter> = {
  fx_vcb: fxVcb,
  fx_free: fxFree,
  rss,
  gold_sjc: goldSjc,
  gold_pnj: goldPnj,
  gold_doji: goldDoji,
  gold_mihong: goldMihong,
};
