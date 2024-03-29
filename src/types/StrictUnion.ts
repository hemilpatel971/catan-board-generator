type UnionKeys<T> = T extends unknown ? keyof T : never;

type InvalidKeys<K extends string | number | symbol> = { [P in K]?: never };
type StrictUnionHelper<T, TAll> = T extends unknown
  ? T & InvalidKeys<Exclude<UnionKeys<TAll>, keyof T>>
  : never;


export type StrictUnion<T> = StrictUnionHelper<T, T>;
