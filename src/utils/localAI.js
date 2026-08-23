// Base de conhecimento local para fallback (comportamento restrito)
const creatorResponses = [
  {
    keywords: ['quem te criou', 'criador', 'quem fez voce', 'origem', 'quem te desenvolveu'],
    response: 'Fui criado por Luzembo Fernando, Engenheiro de Software e Cientista da Computação, natural de Luanda, Angola. Ele é o fundador da Aubrend Corporation.'
  },
  {
    keywords: ['empresa', 'organizacao', 'aubrend'],
    response: 'Aubrend Corporation é a organização por trás de mim, dedicada a criar soluções de IA inovadoras para o mundo.'
  }
];

const generalResponses = [
  {
    keywords: ['ola', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'eae', 'opa'],
    response: 'Olá! Como posso ajudar-te hoje?'
  },
  {
    keywords: ['site responsivo', 'html', 'css', 'javascript', 'react'],
    response: 'Para criar um site responsivo, use HTML semântico, CSS com media queries e, se preferir, React. Posso gerar um exemplo se quiseres.'
  },
  {
    keywords: ['async', 'await', 'promise', 'javascript'],
    response: 'Em JavaScript, podes usar async/await para lidar com operações assíncronas. Exemplo:\n```\nasync function fetchData() {\n  const res = await fetch(url);\n  const data = await res.json();\n  return data;\n}\n```'
  },
  {
    keywords: ['python', 'função', 'def', 'lambda'],
    response: 'Em Python, defines funções com `def` ou usas `lambda` para funções anónimas. Exemplo:\n```python\ndef soma(a, b):\n    return a + b\n```'
  },
  {
    keywords: ['erro', 'bug', 'debug', 'corrigir'],
    response: 'Para depurar, verifica o console, usa console.log e lê as mensagens de erro. Se puderes descrever o erro, posso ajudar.'
  },
  {
    keywords: ['obrigado', 'valeu', 'thanks'],
    response: 'De nada! Estou aqui para ajudar.'
  }
];

const defaultResponse = 'Desculpe, não entendi completamente. Podes reformular a pergunta?';

const getLocalResponse = (text) => {
  const lower = text.toLowerCase();

  // Verificar primeiro se pergunta sobre criador/empresa
  for (const item of creatorResponses) {
    if (item.keywords.some(kw => lower.includes(kw))) {
      return item.response;
    }
  }

  // Depois verificar respostas gerais
  for (const item of generalResponses) {
    if (item.keywords.some(kw => lower.includes(kw))) {
      return item.response;
    }
  }

  // Se pedir código
  if (lower.includes('codigo') || lower.includes('gerar')) {
    return 'Posso gerar código simples. Diz a linguagem e o que pretendes.';
  }

  // Se pedir ajuda
  if (lower.includes('ajuda') || lower.includes('help')) {
    return 'Posso ajudar com programação, exemplos de código e dúvidas comuns.';
  }

  return defaultResponse;
};

module.exports = { getLocalResponse };