// Função para limpar respostas de IA
// Remove asteriscos, cardinais e traços excessivos
const sanitizeResponse = (text) => {
  if (!text) return '';

  // Substituir "## " ou "# " por quebra de linha e bullet
  text = text.replace(/^#{1,6}\s+/gm, '');

  // Remover asteriscos duplos (negrito markdown)
  text = text.replace(/\*\*/g, '');

  // Substituir asterisco simples no início de linha por bullet
  text = text.replace(/^\*\s*/gm, '• ');

  // Remover linhas com "---" (separadores)
  text = text.replace(/^\s*-{3,}\s*$/gm, '');

  // Substituir "???" por "?"
  text = text.replace(/\?{3,}/g, '?');

  // Substituir "!!!" por "!"
  text = text.replace(/!{3,}/g, '!');

  // Remover espaços duplicados
  text = text.replace(/[ \t]+/g, ' ');

  // Remover linhas vazias múltiplas
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
};

module.exports = { sanitizeResponse };