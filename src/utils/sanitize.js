// Sanitiza resposta da IA removendo markdown indevido
const sanitizeResponse = (text) => {
  if (!text) return '';

  // Remover asteriscos duplos e simples
  text = text.replace(/\*\*/g, '');
  text = text.replace(/\*/g, '');

  // Remover cardinais (#)
  text = text.replace(/^#{1,6}\s*/gm, '');

  // Substituir linhas de traço por quebra de linha
  text = text.replace(/^\s*-{3,}\s*$/gm, '');

  // Substituir "???" por "?"
  text = text.replace(/\?{3,}/g, '?');
  text = text.replace(/!{3,}/g, '!');

  // Remover espaços duplicados
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
};

module.exports = { sanitizeResponse };