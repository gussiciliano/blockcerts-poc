declare module 'jsonld' {
  export function canonize(input: any, options?: any): Promise<string>
  export function expand(input: any, options?: any): Promise<any>
  export function compact(input: any, context: any, options?: any): Promise<any>
  export function toRDF(input: any, options?: any): Promise<any>
}

export {}
