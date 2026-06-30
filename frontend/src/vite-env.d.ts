// Déclarations pour les assets statiques
declare module '*.jpg' {
  const src: string;
  export default src;
}
declare module '*.jpeg' {
  const src: string;
  export default src;
}
declare module '*.png' {
  const src: string;
  export default src;
}
declare module '*.svg' {
  const src: string;
  export default src;
}
declare module '*.webp' {
  const src: string;
  export default src;
}

// Déclaration pour les imports CSS en side-effect
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
