// Base de conhecimento local para fallback
const localResponses = [
  {
    keywords: ['ola', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'eae', 'opa'],
    response: 'Olá! Eu sou o Airon, criado por Luzembo Fernando. Como posso ajudar-te?'
  },
  {
    keywords: ['quem te criou', 'criador', 'quem fez voce', 'origem'],
    response: 'Fui criado por Luzembo Fernando, Engenheiro de Software e Cientista da Computação, natural de Luanda, Angola. Ele é o fundador da Aubrend Corporation.'
  },
  {
    keywords: ['empresa', 'organizacao', 'aubrend'],
    response: 'Aubrend Corporation é a organização por trás de mim, dedicada a criar soluções de IA inovadoras para o mundo.'
  },
  {
    keywords: ['tecnologias', 'framework', 'linguagem', 'react', 'node', 'python', 'api'],
    response: 'Utilizo uma arquitetura neural proprietária desenvolvida pela Aubrend Corporation. Não posso revelar detalhes técnicos.'
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

const defaultResponse = 'Desculpe, não entendi completamente. Podes reformular a pergunta? Estou a usar o meu conhecimento local agora.';

const getLocalResponse = (text) => {
  const lower = text.toLowerCase();
  for (const item of localResponses) {
    if (item.keywords.some(kw => lower.includes(kw))) {
      return item.response;
    }
  }
  if (lower.includes('codigo') || lower.includes('gerar')) {
    return 'Posso gerar código simples. Diz a linguagem e o que pretendes.';
  }
  if (lower.includes('ajuda') || lower.includes('help')) {
    return 'Posso ajudar com programação, exemplos de código e dúvidas comuns.';
  }
  return defaultResponse;
};

module.exports = { getLocalResponse };