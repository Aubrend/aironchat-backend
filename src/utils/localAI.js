const getLocalResponse = (text) => {
  const lower = text.toLowerCase();
  if (lower.includes('ola') || lower.includes('oi')) return 'Olá! Como posso ajudar?';
  if (lower.includes('quem te criou') || lower.includes('criador')) return 'Fui criado por Luzembo Fernando.';
  if (lower.includes('obrigado')) return 'De nada!';
  return 'Desculpe, não entendi completamente. Podes reformular?';
};

module.exports = { getLocalResponse };