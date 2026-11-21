const COLOR_DOT = {
  Black: '#1c1917',
  White: '#fafaf9',
  Stone: '#a8a29e',
  Amber: '#d4a574',
  Tan: '#c4a574',
  Navy: '#1e3a5f',
  Olive: '#6b7c4c',
  Cream: '#f5f0e6',
  Peach: '#e8b4a0',
  Grey: '#78716c',
  Gray: '#78716c',
};

export function colorSwatchHex(name) {
  const key = Object.keys(COLOR_DOT).find((k) => k.toLowerCase() === String(name).toLowerCase());
  return key ? COLOR_DOT[key] : '#a8a29e';
}