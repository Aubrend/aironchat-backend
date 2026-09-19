// TESTE DE DIAGNÓSTICO - AironChat Backend
exports.handler = async (event, context) => {
  console.log('Função invocada!', JSON.stringify({ path: event.path, method: event.httpMethod }));
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'ok',
      message: 'Função Netlify a funcionar!',
      path: event.path,
      method: event.httpMethod,
      timestamp: new Date().toISOString(),
    }),
  };
};